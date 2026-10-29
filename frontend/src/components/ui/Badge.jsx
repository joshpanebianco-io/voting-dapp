import { cn } from "../../lib/cn";

const VARIANTS = {
  neutral: "bg-surface-2 text-muted border-edge",
  accent: "bg-accent/10 text-accent border-accent/20",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/25",
  danger: "bg-danger/10 text-danger border-danger/20",
};

const DOTS = {
  neutral: "bg-muted",
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

export function Badge({ variant = "neutral", dot = false, pulse = false, size = "sm", className, children, ...rest }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border font-medium",
        size === "sm" ? "h-6 px-2.5 text-xs" : "h-7 px-3 text-sm",
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {dot && (
        <span className={cn("h-1.5 w-1.5 rounded-full", DOTS[variant], pulse && "animate-pulse-dot")} aria-hidden="true" />
      )}
      {children}
    </span>
  );
}
