import { ClockIcon } from "@heroicons/react/20/solid";
import { useNow } from "../../hooks/useNow";
import { cn } from "../../lib/cn";
import { formatDate, formatDuration, formatRelative } from "../../lib/format";
import { isPollOpen } from "../../lib/polls";

/**
 * "Ends in 2h 13m 05s" while open, "Ended 3 days ago" once closed.
 * `compact` drops the trailing unit for tight spaces.
 */
export function Countdown({ poll, compact = false, icon = true, className }) {
  const now = useNow();
  const { endTime } = poll;
  const remaining = endTime - now;
  const open = isPollOpen(poll, now);

  return (
    <span
      className={cn("inline-flex items-center gap-1.5 whitespace-nowrap text-sm tabular-nums", open ? "text-fg" : "text-muted", className)}
      title={formatDate(endTime)}
    >
      {icon && <ClockIcon className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />}
      {open ? (
        <>
          <span className="text-muted">Ends in</span>
          <span className="font-medium">{formatDuration(remaining, { compact })}</span>
        </>
      ) : (
        <span>Ended {formatRelative(Math.min(endTime, now), now)}</span>
      )}
    </span>
  );
}
