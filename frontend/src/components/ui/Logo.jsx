import { cn } from "../../lib/cn";
import { APP_NAME } from "../../config";

export function LogoMark({ className }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("h-8 w-8", className)} aria-hidden="true">
      <defs>
        <linearGradient id="dv-logo-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#dv-logo-gradient)" />
      <path d="M18 34.5l9 9 19-20" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className, markClassName, wordmarkClassName, wordmark = true }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={markClassName} />
      {wordmark && <span className={cn("text-lg font-bold tracking-tight", wordmarkClassName)}>{APP_NAME}</span>}
    </span>
  );
}
