import { ZeroAddress } from "ethers";
import { getPollManager, getPollRetriever } from "./contracts";

/**
 * @typedef {Object} Poll
 * @property {number} id
 * @property {string} name
 * @property {number} duration      minutes
 * @property {number} startTime     unix seconds
 * @property {number} endTime       unix seconds
 * @property {boolean} isActive     as reported by the chain when fetched
 * @property {string[]} options
 * @property {number[]} voteCounts
 * @property {number} totalVotes
 * @property {string|null} owner
 */

/** Convert an ethers `Result` tuple from PollRetriever into a plain object. */
export function normalizePoll(raw, owner = null) {
  const options = Array.from(raw.options, String);
  const voteCounts = Array.from(raw.voteCounts, (v) => Number(v));
  return {
    id: Number(raw.id),
    name: String(raw.name),
    duration: Number(raw.duration),
    startTime: Number(raw.startTime),
    endTime: Number(raw.endTime),
    isActive: Boolean(raw.isActive),
    options,
    voteCounts,
    totalVotes: voteCounts.reduce((a, b) => a + b, 0),
    owner,
  };
}

/**
 * A poll is open only if the chain said so when it was fetched AND its end
 * time is still ahead of the local clock. The first guard covers early
 * closes and clock skew; the second lets the countdown expire live.
 */
export function isPollOpen(poll, nowSeconds = Date.now() / 1000) {
  return Boolean(poll) && poll.isActive !== false && poll.endTime > nowSeconds;
}

export function secondsRemaining(poll, nowSeconds = Date.now() / 1000) {
  return Math.max(0, Math.floor(poll.endTime - nowSeconds));
}

/** Indexes of the leading option(s). Several indexes mean a tie. */
export function leadingOptions(poll) {
  if (!poll || poll.totalVotes === 0) return [];
  const max = Math.max(...poll.voteCounts);
  return poll.voteCounts.reduce((acc, count, index) => (count === max ? [...acc, index] : acc), []);
}

/** Whether the deployed PollRetriever has getAllPolls() (null = not probed yet). */
let hasGetAllPolls = null;

/**
 * Raw poll tuples for every poll. Prefers the newer `getAllPolls()`; the
 * original deployment only has `getActivePolls()` / `getClosedPolls()`, which
 * filter by msg.sender, so those are called explicitly from the zero address
 * (an address that has never voted) to get the complete set.
 */
async function fetchRawPolls(retriever) {
  if (hasGetAllPolls !== false) {
    try {
      const list = await retriever.getAllPolls();
      hasGetAllPolls = true;
      return list;
    } catch (err) {
      if (hasGetAllPolls === true) throw err; // worked before: a real network error
      hasGetAllPolls = false;
    }
  }
  const overrides = { from: ZeroAddress };
  const [active, closed] = await Promise.all([retriever.getActivePolls(overrides), retriever.getClosedPolls(overrides)]);
  return [...active, ...closed];
}

/** Fetch every poll with its creator, newest first. */
export async function fetchAllPolls() {
  const retriever = getPollRetriever();
  const manager = getPollManager();

  const polls = (await fetchRawPolls(retriever)).map((raw) => normalizePoll(raw));

  const owners = await Promise.all(polls.map((p) => manager.polls(p.id).then((r) => r.owner)));
  owners.forEach((owner, i) => {
    polls[i].owner = owner;
  });

  return polls.sort((a, b) => b.id - a.id);
}

export async function fetchPoll(id) {
  const retriever = getPollRetriever();
  const manager = getPollManager();
  const [raw, info] = await Promise.all([retriever.getPoll(id), manager.polls(id)]);
  if (Number(raw.id) === 0) return null;
  return normalizePoll(raw, info.owner);
}

/**
 * @typedef {Object} VoterStatus
 * @property {boolean} participated
 * @property {boolean} voted
 * @property {number|null} votedOption
 */

/** Fetch the connected account's relationship with each poll id. */
export async function fetchVoterStatuses(pollIds, account) {
  if (!account || pollIds.length === 0) return {};
  const manager = getPollManager();

  const entries = await Promise.all(
    pollIds.map(async (id) => {
      const [participated, voted] = await Promise.all([
        manager.hasParticipated(id, account),
        manager.hasVoted(id, account),
      ]);
      let votedOption = null;
      if (voted) votedOption = Number(await manager.getUserVote(id, account));
      return [id, { participated, voted, votedOption }];
    }),
  );

  return Object.fromEntries(entries);
}

/** Extract the new poll id from a createPoll receipt (falls back to pollCount). */
export async function pollIdFromReceipt(receipt, manager) {
  for (const log of receipt?.logs || []) {
    try {
      const parsed = manager.interface.parseLog(log);
      if (parsed?.name === "PollCreated") return Number(parsed.args.pollId);
    } catch {
      /* not one of ours */
    }
  }
  return Number(await manager.pollCount());
}
