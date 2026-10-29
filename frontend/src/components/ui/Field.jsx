import { forwardRef } from "react";
import { cn } from "../../lib/cn";

export function Field({ label, htmlFor, hint, error, counter, className, children }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {(label || counter) && (
        <div className="flex items-baseline justify-between gap-3">
          {label && (
            <label htmlFor={htmlFor} className="text-sm font-medium">
              {label}
            </label>
          )}
          {counter && <span className="font-mono text-xs text-muted">{counter}</span>}
        </div>
      )}
      {children}
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-sm text-muted">{hint}</p>
      )}
    </div>
  );
}

const hasWidthClass = (className) => /(^|\s)!?(w-|min-w-|max-w-)/.test(className || "");

/** Base input styling. Fills its container unless the caller passes a width class. */
export const inputClasses = (invalid, className) =>
  cn(
    "h-10 rounded-lg border bg-surface px-3 text-sm text-fg placeholder:text-muted/70 transition-colors",
    !hasWidthClass(className) && "w-full",
    "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-60",
    invalid ? "border-danger/60" : "border-edge hover:border-muted/50",
  );

export const Input = forwardRef(function Input({ invalid = false, className, ...rest }, ref) {
  return (
    <input ref={ref} className={cn(inputClasses(invalid, className), className)} aria-invalid={invalid || undefined} {...rest} />
  );
});

export const Select = forwardRef(function Select({ invalid = false, className, children, ...rest }, ref) {
  return (
    <select
      ref={ref}
      className={cn(inputClasses(invalid, className), "pr-8", className)}
      aria-invalid={invalid || undefined}
      {...rest}
    >
      {children}
    </select>
  );
});
