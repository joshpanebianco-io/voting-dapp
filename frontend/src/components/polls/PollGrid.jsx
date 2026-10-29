import { useEffect, useMemo, useState } from "react";
import { POLLS_PER_PAGE } from "../../config";
import { usePolls } from "../../context/PollsContext";
import { useWallet } from "../../context/WalletContext";
import { Pagination } from "../ui/Pagination";
import { PollCardSkeleton } from "../ui/Skeleton";
import { PollCard } from "./PollCard";

/** Paginated grid of poll cards. Resets to page 1 whenever `resetKey` changes. */
export function PollGrid({ polls, loading = false, emptyState, resetKey, perPage = POLLS_PER_PAGE }) {
  const { voterStatus } = usePolls();
  const { account } = useWallet();
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  const totalPages = Math.max(1, Math.ceil(polls.length / perPage));
  const safePage = Math.min(page, totalPages);
  const visible = useMemo(() => polls.slice((safePage - 1) * perPage, safePage * perPage), [polls, safePage, perPage]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <PollCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (polls.length === 0) return emptyState || null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((poll) => (
          <PollCard key={poll.id} poll={poll} status={voterStatus[poll.id]} account={account} />
        ))}
      </div>
      <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
