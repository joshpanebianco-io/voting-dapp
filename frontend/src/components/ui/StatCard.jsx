import { cn } from "../../lib/cn";
import { Skeleton } from "./Skeleton";

export function StatCard({ label, value, hint, icon: Icon, loading = false, className }) {
  return (
    <div className={cn("rounded-2xl border border-edge bg-surface p-5 shadow-card", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted">{label}</p>
        {Icon && <Icon className="h-5 w-5 text-muted/70" aria-hidden="true" />}
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-8 w-20" />
      ) : (
        <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight">{value}</p>
      )}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
