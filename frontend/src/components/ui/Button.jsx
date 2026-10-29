import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/cn";
import { Spinner } from "./Spinner";

const VARIANTS = {
  primary: "bg-accent text-accent-fg hover:bg-accent-hover shadow-sm",
  secondary: "bg-surface-2 text-fg border border-edge hover:border-muted/50",
  outline: "border border-edge bg-surface text-fg hover:bg-surface-2",
  ghost: "text-fg hover:bg-surface-2",
  subtle: "bg-accent/10 text-accent hover:bg-accent/15",
  danger: "bg-danger text-white hover:bg-danger/90 shadow-sm",
  "danger-outline": "border border-danger/40 text-danger hover:bg-danger/10",
  inverse: "bg-white text-[#4f46e5] shadow-sm hover:bg-white/90",
};

const SIZES = {
  xs: "h-7 px-2.5 text-xs gap-1 rounded-md",
  sm: "h-8 px-3 text-sm gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-lg",
  lg: "h-12 px-6 text-base gap-2 rounded-xl",
  icon: "h-9 w-9 rounded-lg",
};

export const Button = forwardRef(function Button(
  { to, href, variant = "primary", size = "md", loading = false, disabled, leftIcon, rightIcon, className, children, ...rest },
  ref,
) {
  const classes = cn(
    "inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition-colors",
    "disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className,
  );

  const content = (
    <>
      {loading ? <Spinner className="h-4 w-4" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </>
  );

  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} aria-disabled={disabled || undefined} {...rest}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a ref={ref} href={href} target="_blank" rel="noreferrer" className={classes} {...rest}>
        {content}
      </a>
    );
  }
  return (
    <button ref={ref} type="button" className={classes} disabled={disabled || loading} {...rest}>
      {content}
    </button>
  );
});
