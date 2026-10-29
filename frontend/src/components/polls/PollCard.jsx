import { Link } from "react-router-dom";
import { ArrowRightIcon, CheckBadgeIcon } from "@heroicons/react/20/solid";
import { useNow } from "../../hooks/useNow";
import { cn } from "../../lib/cn";
import { formatCount, isSameAddress, shortAddress } from "../../lib/format";
import { isPollOpen } from "../../lib/polls";
import { Badge } from "../ui/Badge";
import { AddressAvatar } from "../ui/AddressChip";
import { Countdown } from "./Countdown";
import { PollResults } from "./PollResults";
import { PollStatusBadge } from "./PollStatusBadge";

/**
 * Summary card used in every poll list. The whole card links to the poll page.
 * `status` is the connected account's { participated, voted, votedOption }.
 */
export function PollCard({ poll, status, account, className }) {
  const now = useNow();
  const open = isPollOpen(poll, now);
  const voted = Boolean(status?.voted);
  const registered = Boolean(status?.participated) && !voted;
  const isCreator = isSameAddress(poll.owner, account);

  let cta = { label: "View results", variant: "muted" };
  if (open) {
    if (voted) cta = { label: "You voted", variant: "done" };
    else if (registered) cta = { label: "Cast your vote", variant: "primary" };
    else cta = { label: account ? "Register & vote" : "View poll", variant: "default" };
  }

  return (
    <Link
      to={`/polls/${poll.id}`}
      className={cn(
        "group flex h-full flex-col rounded-2xl border border-edge bg-surface p-5 shadow-card transition-[border-color,box-shadow,transform]",
        "hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-pop focus-visible:border-accent",
        className,
      )}
      aria-label={`${poll.name}: ${open ? "active poll" : "closed poll"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <PollStatusBadge poll={poll} />
          {isCreator && <Badge variant="accent">Yours</Badge>}
        </div>
        <span className="font-mono text-xs text-muted">#{poll.id}</span>
      </div>

      <h3 className="mt-3 line-clamp-2 text-base font-semibold leading-snug tracking-tight text-fg" title={poll.name}>
        {poll.name}
      </h3>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
        {poll.owner && (
          <span className="inline-flex items-center gap-1.5">
            <AddressAvatar address={poll.owner} className="h-3.5 w-3.5" />
            <span className="font-mono">{shortAddress(poll.owner)}</span>
          </span>
        )}
        <span aria-hidden="true">·</span>
        <span>{formatCount(poll.options.length, "option")}</span>
        <span aria-hidden="true">·</span>
        <span>{formatCount(poll.totalVotes, "vote")}</span>
      </div>

      <div className="mt-4 flex-1">
        <PollResults poll={poll} open={open} votedOption={status?.votedOption ?? null} compact limit={3} />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-edge pt-4">
        <Countdown poll={poll} compact className="text-xs" />
        <span
          className={cn(
            "inline-flex items-center gap-1 text-sm font-medium",
            cta.variant === "primary" && "text-accent",
            cta.variant === "done" && "text-success",
            cta.variant === "muted" && "text-muted",
            cta.variant === "default" && "text-fg",
          )}
        >
          {cta.variant === "done" && <CheckBadgeIcon className="h-4 w-4" />}
          {cta.label}
          {cta.variant !== "done" && (
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          )}
        </span>
      </div>
    </Link>
  );
}
