/**
 * Turn an ethers / wallet error into a short, human-readable sentence.
 * Handles the custom errors of the new contracts as well as the plain
 * `require` strings of the original deployment.
 */

const CUSTOM_ERRORS = {
  PollNotFound: "That poll does not exist.",
  PollEnded: "This poll has already ended.",
  AlreadyRegistered: "You have already registered for this poll.",
  NotRegistered: "You need to register for this poll before voting.",
  AlreadyVoted: "You have already voted in this poll.",
  NotVoted: "You have not voted in this poll.",
  InvalidOption: "That option is not valid for this poll.",
  NotAuthorized: "Only the poll creator can do that.",
  InvalidName: "The poll title is empty or too long.",
  InvalidOptionCount: "A poll needs between 2 and 10 options.",
  InvalidOptionText: "Every option needs text (max 80 characters).",
  DuplicateOption: "Options must be unique.",
  InvalidDuration: "The duration is out of range.",
  NonTransferable: "Ballots are non-transferable.",
  OnlyPollManager: "Only the poll contract may do that.",
};

const REASON_STRINGS = [
  [/poll has ended/i, "This poll has already ended."],
  [/already participated/i, "You have already registered for this poll."],
  [/already voted/i, "You have already voted in this poll."],
  [/must hold the nft/i, "You need to register for this poll before voting."],
  [/invalid option/i, "That option is not valid for this poll."],
  [/only the poll creator/i, "Only the poll creator can do that."],
  [/at least two options/i, "A poll needs at least two options."],
  [/duration must be positive/i, "The duration must be at least one minute."],
  [/poll does not exist/i, "That poll does not exist."],
  [/token does not exist/i, "Your ballot could not be found."],
];

export function isUserRejection(err) {
  if (!err) return false;
  const code = err.code ?? err.info?.error?.code ?? err.error?.code;
  return (
    code === "ACTION_REJECTED" ||
    code === 4001 ||
    /user rejected|user denied|rejected the request/i.test(String(err.message || ""))
  );
}

export function describeError(err, fallback = "Something went wrong. Please try again.") {
  if (!err) return fallback;
  if (typeof err === "string") return err;

  if (isUserRejection(err)) return "Transaction was rejected in your wallet.";

  const code = err.code ?? err.info?.error?.code;
  const message = String(err.shortMessage || err.message || "");

  if (code === "INSUFFICIENT_FUNDS" || /insufficient funds/i.test(message)) {
    return "Not enough ETH in your wallet to pay for gas. Top up from a faucet and try again.";
  }
  if (code === "NETWORK_ERROR" || /network changed|failed to fetch|network error/i.test(message)) {
    return "Network error. Check your connection (and wallet network) and try again.";
  }
  if (code === "TIMEOUT") return "The request timed out. Please try again.";
  if (code === "UNSUPPORTED_OPERATION" && /signer|getSigner|eth_sendTransaction/i.test(message)) {
    return "Connect a wallet to send transactions.";
  }

  const revertName = err.revert?.name;
  if (revertName && CUSTOM_ERRORS[revertName]) return CUSTOM_ERRORS[revertName];

  const reason = err.reason || err.info?.error?.data?.message || err.info?.error?.message || message;
  if (reason) {
    for (const [pattern, text] of REASON_STRINGS) {
      if (pattern.test(reason)) return text;
    }
    const cleaned = reason
      .replace(/^execution reverted:?\s*/i, "")
      .replace(/\(action=.*$/s, "")
      .replace(/\[ See:.*$/s, "")
      .trim();
    if (cleaned && cleaned.length <= 160 && !/^0x/.test(cleaned)) return cleaned;
  }

  return fallback;
}
