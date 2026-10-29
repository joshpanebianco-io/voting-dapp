import { useEffect } from "react";
import {
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { cn } from "../../lib/cn";
import { Spinner } from "./Spinner";

const ICONS = {
  info: <InformationCircleIcon className="h-5 w-5 text-accent" />,
  success: <CheckCircleIcon className="h-5 w-5 text-success" />,
  error: <ExclamationCircleIcon className="h-5 w-5 text-danger" />,
  pending: <Spinner className="h-5 w-5 text-accent" />,
};

function ToastItem({ toast, onDismiss }) {
  const { id, variant, title, description, action, duration } = toast;

  useEffect(() => {
    if (!duration) return undefined;
    const timer = setTimeout(() => onDismiss(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, variant, onDismiss]);

  return (
    <div
      role="status"
      aria-live={variant === "error" ? "assertive" : "polite"}
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-surface p-4 shadow-pop animate-toast-in",
        variant === "error" ? "border-danger/30" : "border-edge",
      )}
    >
      <div className="mt-0.5 shrink-0">{ICONS[variant] || ICONS.info}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        {description && <p className="mt-0.5 break-words text-sm text-muted">{description}</p>}
        {action?.href && (
          <a
            href={action.href}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
          >
            {action.label}
            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        className="-mr-1 -mt-1 shrink-0 rounded-md p-1 text-muted transition-colors hover:bg-surface-2 hover:text-fg"
        aria-label="Dismiss notification"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastViewport({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
