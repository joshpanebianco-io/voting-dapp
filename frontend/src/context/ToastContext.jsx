import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { ToastViewport } from "../components/ui/Toast";

const ToastContext = createContext(null);
const MAX_VISIBLE = 4;

/**
 * Toast shape: { id, variant: 'info'|'success'|'error'|'pending', title,
 * description?, action?: { label, href }, duration (ms, 0 = sticky) }
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((toast) => {
    const id = ++counter.current;
    const item = { id, variant: "info", duration: 5000, ...toast };
    setToasts((list) => [...list.slice(-(MAX_VISIBLE - 1)), item]);
    return id;
  }, []);

  const update = useCallback((id, patch) => {
    setToasts((list) => list.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const api = useMemo(
    () => ({
      push,
      update,
      dismiss,
      info: (title, opts) => push({ variant: "info", title, ...opts }),
      success: (title, opts) => push({ variant: "success", title, ...opts }),
      error: (title, opts) => push({ variant: "error", title, duration: 8000, ...opts }),
      pending: (title, opts) => push({ variant: "pending", title, duration: 0, ...opts }),
    }),
    [push, update, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
