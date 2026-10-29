import { Link, useParams } from "react-router-dom";
import { ArrowLeftIcon, CheckIcon, LinkIcon } from "@heroicons/react/20/solid";
import { DocumentMagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { PageHeader } from "../components/layout/Layout";
import { ClosePollButton } from "../components/polls/ClosePollButton";
import { Countdown } from "../components/polls/Countdown";
import { PollListError } from "../components/polls/PollListError";
import { PollResults } from "../components/polls/PollResults";
import { PollStatusBadge } from "../components/polls/PollStatusBadge";
import { VotePanel } from "../components/polls/VotePanel";
import { AddressChip } from "../components/ui/AddressChip";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";
import { ADDRESSES } from "../config";
import { usePoll, usePolls } from "../context/PollsContext";
import { useWallet } from "../context/WalletContext";
import { useCopy } from "../hooks/useCopy";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useNow } from "../hooks/useNow";
import { formatCount, formatDate, formatMinutes, isSameAddress } from "../lib/format";
import { isPollOpen, leadingOptions } from "../lib/polls";

export function PollDetailPage() {
  const { id } = useParams();
  const { poll, loading, notFound, error } = usePoll(id);
  const { voterStatus, refresh } = usePolls();
  const { account } = useWallet();
  const now = useNow();
  const [copied, copy] = useCopy();
  useDocumentTitle(poll ? poll.name : "Poll");

  if (loading) return <DetailSkeleton />;

  if (notFound) {
    return (
      <EmptyState
        icon={DocumentMagnifyingGlassIcon}
        title="Poll not found"
        description={`There is no poll with id “${id}” on this network.`}
        action={
          <Button variant="secondary" to="/polls">
            Back to polls
          </Button>
        }
      />
    );
  }

  if (error || !poll) return <PollListError message={error || "Could not load this poll."} onRetry={refresh} />;

  const open = isPollOpen(poll, now);
  const status = account ? voterStatus[poll.id] : null;
  const isCreator = isSameAddress(poll.owner, account);
  const leaders = leadingOptions(poll);
  const winnerLabel =
    !open && poll.totalVotes > 0
      ? leaders.length === 1
        ? poll.options[leaders[0]]
        : `Tie between ${leaders.length} options`
      : null;

  return (
    <div className="space-y-6">
      <div>
        <Link to={open ? "/polls" : "/results"} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-fg">
          <ArrowLeftIcon className="h-4 w-4" />
          {open ? "All active polls" : "All results"}
        </Link>
      </div>

      <PageHeader
        eyebrow={
          <span className="inline-flex flex-wrap items-center gap-2">
            <PollStatusBadge poll={poll} />
            <span className="font-mono text-xs text-muted">Poll #{poll.id}</span>
            {isCreator && <Badge variant="accent">Created by you</Badge>}
          </span>
        }
        title={<span className="break-words">{poll.name}</span>}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copy(window.location.href)}
              leftIcon={copied ? <CheckIcon className="h-4 w-4 text-success" /> : <LinkIcon className="h-4 w-4" />}
            >
              {copied ? "Link copied" : "Share"}
            </Button>
            {isCreator && open && <ClosePollButton poll={poll} />}
          </>
        }
      />

      {/* On large screens the vote panel sits in a sticky right column; on small screens it follows the tally. */}
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
        <Card data-testid="poll-results" className="lg:col-start-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">{open ? "Live tally" : "Final results"}</h2>
              <p className="mt-0.5 text-sm text-muted">
                {formatCount(poll.totalVotes, "vote")} across {formatCount(poll.options.length, "option")}
              </p>
            </div>
            <Countdown poll={poll} />
          </div>

          {winnerLabel && (
            <div className="mt-4 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
              <span className="text-muted">Winner: </span>
              <span className="font-semibold">{winnerLabel}</span>
            </div>
          )}
          {!open && poll.totalVotes === 0 && (
            <div className="mt-4 rounded-xl bg-surface-2 px-4 py-3 text-sm text-muted">This poll closed without any votes.</div>
          )}

          <PollResults poll={poll} open={open} votedOption={status?.votedOption ?? null} className="mt-6" />
        </Card>

        <VotePanel
          poll={poll}
          status={status}
          className="lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1 lg:row-span-2"
        />

        <Card className="lg:col-start-1">
          <h2 className="text-base font-semibold">Details</h2>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <Detail label="Created by">
              {poll.owner ? <AddressChip address={poll.owner} avatar /> : <span className="text-muted">Unknown</span>}
            </Detail>
            <Detail label="Duration">{formatMinutes(poll.duration)}</Detail>
            <Detail label="Opened">{formatDate(poll.startTime)}</Detail>
            <Detail label={open ? "Closes" : "Closed"}>{formatDate(poll.endTime)}</Detail>
            <Detail label="Contract">
              <AddressChip address={ADDRESSES.pollManager} label="PollManager" />
            </Detail>
            <Detail label="Ballots">
              <span>Soulbound NFT, burned on vote</span>
            </Detail>
          </dl>
        </Card>
      </div>
    </div>
  );
}

function Detail({ label, children }) {
  return (
    <div className="rounded-xl bg-surface-2 px-4 py-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 break-words font-medium">{children}</dd>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading poll">
      <Skeleton className="h-4 w-28" />
      <div className="space-y-3">
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="h-9 w-2/3" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card className="space-y-5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </Card>
        <Card className="space-y-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </Card>
      </div>
    </div>
  );
}
