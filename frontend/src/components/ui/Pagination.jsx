import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { cn } from "../../lib/cn";

function pageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push("…");
    result.push(p);
  });
  return result;
}

export function Pagination({ page, totalPages, onChange, className }) {
  if (totalPages <= 1) return null;

  const navButton =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-edge bg-surface px-2 text-sm font-medium transition-colors hover:bg-surface-2 disabled:opacity-40 disabled:pointer-events-none";

  return (
    <nav className={cn("flex items-center justify-center gap-1.5", className)} aria-label="Pagination">
      <button type="button" className={navButton} onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
        <ChevronLeftIcon className="h-4 w-4" />
      </button>
      {pageList(page, totalPages).map((item, index) =>
        item === "…" ? (
          <span key={`gap-${index}`} className="px-1 text-sm text-muted">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-current={item === page ? "page" : undefined}
            className={cn(navButton, item === page && "border-accent bg-accent text-accent-fg hover:bg-accent")}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        className={navButton}
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </nav>
  );
}
