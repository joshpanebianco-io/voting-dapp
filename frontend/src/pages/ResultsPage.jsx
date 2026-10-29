import { useMemo, useState } from "react";
import { ArchiveBoxIcon } from "@heroicons/react/24/outline";
import { PageHeader } from "../components/layout/Layout";
import { PollGrid } from "../components/polls/PollGrid";
import { PollListError } from "../components/polls/PollListError";
import { PollToolbar } from "../components/polls/PollToolbar";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { usePolls } from "../context/PollsContext";
import { useWallet } from "../context/WalletContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useNow } from "../hooks/useNow";
import { isPollOpen } from "../lib/polls";

const SORTS = [
  { value: "recent", label: "Recently closed" },
  { value: "votes", label: "Most votes" },
  { value: "oldest", label: "Oldest" },
];

export function ResultsPage() {
  useDocumentTitle("Results");
  const { polls, status, error, refresh, voterStatus } = usePolls();
  const { isConnected } = useWallet();
  const now = useNow();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("recent");

  const closed = useMemo(() => polls.filter((p) => !isPollOpen(p, now)), [polls, now]);
  const votedCount = useMemo(() => closed.filter((p) => voterStatus[p.id]?.voted).length, [closed, voterStatus]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = closed.filter((p) => !term || p.name.toLowerCase().includes(term) || String(p.id) === term);
    if (isConnected && filter === "voted") list = list.filter((p) => voterStatus[p.id]?.voted);
    return [...list].sort((a, b) => {
      if (sort === "votes") return b.totalVotes - a.totalVotes || b.endTime - a.endTime;
      if (sort === "oldest") return a.endTime - b.endTime;
      return b.endTime - a.endTime;
    });
  }, [closed, search, filter, sort, isConnected, voterStatus]);

  const filters = isConnected
    ? [
        { value: "all", label: "All", count: closed.length },
        { value: "voted", label: "I voted", count: votedCount },
      ]
    : null;

  const loading = status === "loading";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Results"
        description={
          loading
            ? "Loading polls from the network…"
            : `${closed.length} closed ${closed.length === 1 ? "poll" : "polls"}. Every tally below is final and verifiable on-chain.`
        }
      />

      {status === "error" ? (
        <PollListError message={error} onRetry={refresh} />
      ) : (
        <>
          <PollToolbar
            search={search}
            onSearch={setSearch}
            filters={filters}
            filter={filter}
            onFilter={setFilter}
            sortOptions={SORTS}
            sort={sort}
            onSort={setSort}
          />
          <PollGrid
            polls={visible}
            loading={loading}
            resetKey={`${search}|${filter}|${sort}`}
            emptyState={
              closed.length === 0 ? (
                <EmptyState
                  icon={ArchiveBoxIcon}
                  title="No results yet"
                  description="Results appear here once a poll's time runs out or its creator closes it."
                  action={
                    <Button variant="secondary" to="/polls">
                      See active polls
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  icon={ArchiveBoxIcon}
                  title="Nothing matches"
                  description="Try a different search term or filter."
                  action={
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setSearch("");
                        setFilter("all");
                      }}
                    >
                      Clear filters
                    </Button>
                  }
                />
              )
            }
          />
        </>
      )}
    </div>
  );
}
