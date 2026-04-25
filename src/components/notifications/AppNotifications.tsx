"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

export type ToastVariant = "success" | "error" | "info";

type ToastItem = { id: string; message: string; variant: ToastVariant };

export type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Акцентная кнопка подтверждения (удаление и т.п.) */
  danger?: boolean;
};

type ConfirmState = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

type AppNotificationsContextValue = {
  toast: (opts: { message: string; variant?: ToastVariant }) => void;
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
};

const AppNotificationsContext =
  createContext<AppNotificationsContextValue | null>(null);

const TOAST_TTL_MS = 5200;
const MAX_TOASTS = 5;

function newToastId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function AppNotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const dismissToast = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback(
    (opts: { message: string; variant?: ToastVariant }) => {
      const id = newToastId();
      const item: ToastItem = {
        id,
        message: opts.message,
        variant: opts.variant ?? "info",
      };
      setToasts((t) => [...t, item].slice(-MAX_TOASTS));
      window.setTimeout(() => dismissToast(id), TOAST_TTL_MS);
    },
    [dismissToast]
  );

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ ...opts, resolve });
    });
  }, []);

  const finishConfirm = useCallback((value: boolean) => {
    setConfirmState((prev) => {
      prev?.resolve(value);
      return null;
    });
  }, []);

  return (
    <AppNotificationsContext.Provider value={{ toast, confirm }}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      {confirmState ? (
        <ConfirmOverlay state={confirmState} onFinish={finishConfirm} />
      ) : null}
    </AppNotificationsContext.Provider>
  );
}

export function useAppNotifications(): AppNotificationsContextValue {
  const ctx = useContext(AppNotificationsContext);
  if (!ctx) {
    throw new Error(
      "useAppNotifications: оберните приложение в AppNotificationsProvider (см. app/layout.tsx)."
    );
  }
  return ctx;
}

function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (!toasts.length) return null;
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[200] flex flex-col gap-2 px-4 pt-4 sm:pl-[calc(var(--app-sidebar-width,260px)+1.25rem)] sm:pr-8"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <ToastBanner key={t.id} item={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastBanner({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: () => void;
}) {
  const borderClass =
    item.variant === "error"
      ? "border-rose-500/45"
      : item.variant === "success"
        ? "border-emerald-500/40"
        : "border-[color-mix(in_srgb,var(--accent)_35%,var(--border))]";

  return (
    <div
      role="status"
      className={`pointer-events-auto flex max-w-[min(32rem,calc(100vw-2rem))] items-start gap-3 rounded-xl border bg-[var(--surface-elevated)] px-4 py-3 shadow-lg shadow-black/35 sm:max-w-md ${borderClass}`}
    >
      <p className="min-w-0 flex-1 text-[14px] leading-snug text-[var(--foreground)]">
        {item.message}
      </p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-lg px-2 py-1 text-[18px] leading-none text-[var(--muted)] transition-colors hover:bg-[var(--border)] hover:text-[var(--foreground)]"
        aria-label="Закрыть уведомление"
      >
        ×
      </button>
    </div>
  );
}

function ConfirmOverlay({
  state,
  onFinish,
}: {
  state: ConfirmState;
  onFinish: (v: boolean) => void;
}) {
  const descId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFinish(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onFinish]);

  const confirmLabel = state.confirmLabel ?? "ОК";
  const cancelLabel = state.cancelLabel ?? "Отмена";

  return (
    <div
      className="fixed inset-0 z-[210] flex items-center justify-center bg-black/55 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onFinish(false);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={state.title ?? "Подтверждение"}
        aria-describedby={descId}
        className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xl shadow-black/40 sm:p-6"
      >
        {state.title ? (
          <h2 className="text-[16px] font-semibold text-[var(--foreground)]">
            {state.title}
          </h2>
        ) : null}
        <p
          id={descId}
          className={`whitespace-pre-line text-[14px] leading-relaxed text-[var(--foreground)] ${state.title ? "mt-2" : ""}`}
        >
          {state.message}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={() => onFinish(false)}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-2.5 text-[14px] font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--border)]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => onFinish(true)}
            className={`rounded-xl px-4 py-2.5 text-[14px] font-semibold transition-opacity hover:opacity-90 ${
              state.danger
                ? "bg-rose-600 text-white"
                : "bg-[var(--accent)] text-[#0e1016]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
