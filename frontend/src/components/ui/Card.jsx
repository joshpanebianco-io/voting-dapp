import { cn } from "../../lib/cn";

export function Card({ as: Tag = "div", interactive = false, padded = true, className, children, ...rest }) {
  return (
    <Tag
      className={cn(
        "rounded-2xl border border-edge bg-surface shadow-card",
        padded && "p-5 sm:p-6",
        interactive && "transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-pop",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function CardTitle({ className, children, ...rest }) {
  return (
    <h3 className={cn("text-base font-semibold tracking-tight text-fg", className)} {...rest}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...rest }) {
  return (
    <p className={cn("mt-1 text-sm text-muted", className)} {...rest}>
      {children}
    </p>
  );
}
