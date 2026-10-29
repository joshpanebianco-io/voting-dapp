import { CheckCircleIcon, TrophyIcon } from "@heroicons/react/20/solid";
import { cn } from "../../lib/cn";
import { formatPercent, percent } from "../../lib/format";

/**
 * One option row with a horizontal tally bar.
 * - `leading`: this option currently has the most votes
 * - `winner`:  poll is closed and this option won (or tied for first)
 * - `mine`:    the connected account voted for this option
 */
export function ResultBar({ label, count, total, leading = false, winner = false, mine = false, compact = false, className }) {
  const pct = percent(count, total);

  return (
    <div className={cn("group", className)}>
      <div className={cn("flex items-center justify-between gap-3", compact ? "mb-1" : "mb-1.5")}>
        <div className="flex min-w-0 items-center gap-1.5">
          <span className={cn("truncate", compact ? "text-sm" : "text-sm font-medium", winner && "text-fg")} title={label}>
            {label}
          </span>
          {winner && <TrophyIcon className="h-4 w-4 shrink-0 text-warning" aria-label="Winner" />}
          {mine && <CheckCircleIcon className="h-4 w-4 shrink-0 text-accent" aria-label="Your vote" />}
        </div>
        <div className="flex shrink-0 items-baseline gap-1.5 tabular-nums">
          <span className={cn("font-semibold", compact ? "text-sm" : "text-sm")}>{formatPercent(pct, pct > 0 && pct < 10 ? 1 : 0)}</span>
          {!compact && (
            <span className="text-xs text-muted">
              {count} {count === 1 ? "vote" : "votes"}
            </span>
          )}
        </div>
      </div>
      <div
        className={cn("w-full overflow-hidden rounded-full bg-surface-2", compact ? "h-1.5" : "h-2.5")}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${count} votes`}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-700 ease-out",
            winner || leading ? "bg-accent" : mine ? "bg-accent/70" : "bg-muted/50",
          )}
          style={{ width: `${Math.max(pct, count > 0 ? 1.5 : 0)}%` }}
        />
      </div>
    </div>
  );
}
