import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { IS_CONFIGURED, REFRESH_INTERVAL_MS } from "../config";
import { describeError } from "../lib/errors";
import { fetchAllPolls, fetchPoll, fetchVoterStatuses, isPollOpen } from "../lib/polls";
import { useWallet } from "./WalletContext";

const PollsContext = createContext(null);

const NOT_CONFIGURED_MESSAGE =
  "The app is missing its contract configuration. Set VITE_POLLMANAGER_CONTRACT_ADDRESS and VITE_POLLRETRIEVER_CONTRACT_ADDRESS in frontend/.env.";

export function PollsProvider({ children }) {
  const { account } = useWallet();

  const [polls, setPolls] = useState([]);
  const [status, setStatus] = useState(IS_CONFIGURED ? "loading" : "error"); // loading | ready | error
  const [error, setError] = useState(IS_CONFIGURED ? null : NOT_CONFIGURED_MESSAGE);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [voterStatus, setVoterStatus] = useState({}); // pollId -> { participated, voted, votedOption }
  const inFlight = useRef(null);
  const voterStatusRef = useRef({});

  // ------------------------------------------------------------------ polls
  const refresh = useCallback(() => {
    if (!IS_CONFIGURED) return Promise.resolve();
    if (inFlight.current) return inFlight.current;

    inFlight.current = (async () => {
      try {
        const list = await fetchAllPolls();
        setPolls(list);
        setStatus("ready");
        setError(null);
        setLastUpdated(Date.now());
      } catch (err) {
        console.error("Failed to load polls", err);
        setError(describeError(err, "Could not load polls from the network."));
        setStatus((prev) => (prev === "ready" ? "ready" : "error"));
      } finally {
        inFlight.current = null;
      }
    })();
    return inFlight.current;
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, REFRESH_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  // ------------------------------------------------------------------ voter status
  useEffect(() => {
    voterStatusRef.current = {};
    setVoterStatus({});
  }, [account]);

  useEffect(() => {
    if (!account || polls.length === 0) return undefined;
    const now = Date.now() / 1000;
    // Closed polls can no longer change for a voter, so only refetch open ones
    // plus anything we have never seen.
    const ids = polls
      .filter((p) => isPollOpen(p, now) || !(p.id in voterStatusRef.current))
      .map((p) => p.id);
    if (ids.length === 0) return undefined;

    let cancelled = false;
    fetchVoterStatuses(ids, account)
      .then((result) => {
        if (cancelled) return;
        voterStatusRef.current = { ...voterStatusRef.current, ...result };
        setVoterStatus(voterStatusRef.current);
      })
      .catch((err) => console.error("Failed to load voter status", err));
    return () => {
      cancelled = true;
    };
  }, [account, polls, lastUpdated]);

  // ------------------------------------------------------------------ optimistic updates
  const applyRegistration = useCallback((pollId) => {
    voterStatusRef.current = {
      ...voterStatusRef.current,
      [pollId]: { ...(voterStatusRef.current[pollId] || {}), participated: true, voted: false, votedOption: null },
    };
    setVoterStatus(voterStatusRef.current);
  }, []);

  const applyVote = useCallback((pollId, optionIndex) => {
    voterStatusRef.current = {
      ...voterStatusRef.current,
      [pollId]: { participated: true, voted: true, votedOption: optionIndex },
    };
    setVoterStatus(voterStatusRef.current);
    setPolls((list) =>
      list.map((p) => {
        if (p.id !== pollId) return p;
        const voteCounts = p.voteCounts.map((c, i) => (i === optionIndex ? c + 1 : c));
        return { ...p, voteCounts, totalVotes: p.totalVotes + 1 };
      }),
    );
  }, []);

  const applyClose = useCallback((pollId) => {
    const now = Math.floor(Date.now() / 1000);
    setPolls((list) =>
      list.map((p) => (p.id === pollId ? { ...p, isActive: false, endTime: Math.min(p.endTime, now) } : p)),
    );
  }, []);

  const upsertPoll = useCallback((poll) => {
    setPolls((list) => {
      const others = list.filter((p) => p.id !== poll.id);
      return [...others, poll].sort((a, b) => b.id - a.id);
    });
  }, []);

  // ------------------------------------------------------------------ derived
  const stats = useMemo(() => {
    const now = Date.now() / 1000;
    const active = polls.filter((p) => isPollOpen(p, now)).length;
    return {
      total: polls.length,
      active,
      closed: polls.length - active,
      votes: polls.reduce((sum, p) => sum + p.totalVotes, 0),
    };
  }, [polls]);

  const value = useMemo(
    () => ({
      polls,
      status,
      error,
      lastUpdated,
      voterStatus,
      stats,
      refresh,
      applyRegistration,
      applyVote,
      applyClose,
      upsertPoll,
    }),
    [polls, status, error, lastUpdated, voterStatus, stats, refresh, applyRegistration, applyVote, applyClose, upsertPoll],
  );

  return <PollsContext.Provider value={value}>{children}</PollsContext.Provider>;
}

export function usePolls() {
  const ctx = useContext(PollsContext);
  if (!ctx) throw new Error("usePolls must be used within PollsProvider");
  return ctx;
}

/**
 * One poll by id. Uses the shared list when possible and fetches the poll
 * directly otherwise (e.g. a deep link opened before the list has loaded).
 */
export function usePoll(id) {
  const { polls, status, upsertPoll } = usePolls();
  const numericId = Number(id);
  const fromList = polls.find((p) => p.id === numericId) || null;
  const [single, setSingle] = useState({ poll: null, loading: false, notFound: false, error: null });

  useEffect(() => {
    if (fromList || !Number.isInteger(numericId) || numericId <= 0) return undefined;
    if (!IS_CONFIGURED) return undefined;
    let cancelled = false;
    setSingle({ poll: null, loading: true, notFound: false, error: null });
    fetchPoll(numericId)
      .then((poll) => {
        if (cancelled) return;
        if (!poll) setSingle({ poll: null, loading: false, notFound: true, error: null });
        else {
          setSingle({ poll, loading: false, notFound: false, error: null });
          upsertPoll(poll);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const notFound = /PollNotFound|does not exist|revert/i.test(String(err?.message || err?.reason || ""));
        setSingle({ poll: null, loading: false, notFound, error: notFound ? null : describeError(err) });
      });
    return () => {
      cancelled = true;
    };
  }, [numericId, fromList, upsertPoll]);

  if (fromList) return { poll: fromList, loading: false, notFound: false, error: null };
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return { poll: null, loading: false, notFound: true, error: null };
  }
  return {
    poll: single.poll,
    loading: single.loading || (status === "loading" && !single.notFound && !single.error),
    notFound: single.notFound,
    error: single.error,
  };
}
