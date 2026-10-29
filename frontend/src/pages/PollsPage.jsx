import { useMemo, useState } from "react";
import { InboxIcon, PlusIcon } from "@heroicons/react/24/outline";
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
  { value: "ending", label: "Ending soon" },
  { value: "newest", label: "Newest" },
  { value: "votes", label: "Most votes" },
];

export function PollsPage() {
  useDocumentTitle("Active polls");
  const { polls, status, error, refresh, voterStatus } = usePolls();
  const { isConnected } = useWallet();
  const now = useNow();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("ending");

  const active = useMemo(() => polls.filter((p) => isPollOpen(p, now)), [polls, now]);

  const counts = useMemo(() => {
    const result = { all: active.length, open: 0, registered: 0, voted: 0 };
    active.forEach((p) => {
      const s = voterStatus[p.id];
      if (s?.voted) result.voted += 1;
      else if (s?.participated) result.registered += 1;
      else result.open += 1;
    });
    return result;
  }, [active, voterStatus]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = active.filter((p) => !term || p.name.toLowerCase().includes(term) || String(p.id) === term);
    if (isConnected && filter !== "all") {
      list = list.filter((p) => {
        const s = voterStatus[p.id];
        if (filter === "voted") return Boolean(s?.voted);
        if (filter === "registered") return Boolean(s?.participated) && !s?.voted;
        return !s?.participated;
      });
    }
    return [...list].sort((a, b) => {
      if (sort === "newest") return b.id - a.id;
      if (sort === "votes") return b.totalVotes - a.totalVotes || b.id - a.id;
      return a.endTime - b.endTime;
    });
  }, [active, search, filter, sort, isConnected, voterStatus]);

  const filters = isConnected
    ? [
        { value: "all", label: "All", count: counts.all },
        { value: "open", label: "Not voted", count: counts.open },
        { value: "registered", label: "Registered", count: counts.registered },
        { value: "voted", label: "Voted", count: counts.voted },
      ]
    : null;

  const showError = status === "error";
  const loading = status === "loading";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Active polls"
        description={
          loading
            ? "Loading polls from the network…"
            : `${active.length} ${active.length === 1 ? "poll is" : "polls are"} open for voting right now.`
        }
        actions={
          <Button to="/create" leftIcon={<PlusIcon className="h-4 w-4" />}>
            New poll
          </Button>
        }
      />

      {showError ? (
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
          {error && status === "ready" && (
            <p className="text-xs text-warning">Showing the last successful update. {error}</p>
          )}
          <PollGrid
            polls={visible}
            loading={loading}
            resetKey={`${search}|${filter}|${sort}`}
            emptyState={
              active.length === 0 ? (
                <EmptyState
                  icon={InboxIcon}
                  title="No active polls right now"
                  description="Every poll has closed. Start a new one and it will appear here instantly."
                  action={<Button to="/create">Create a poll</Button>}
                />
              ) : (
                <EmptyState
                  icon={InboxIcon}
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
