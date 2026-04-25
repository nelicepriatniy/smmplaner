"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import type { PostsClientFilterOption } from "@/components/posts/PostsClientFilter";
import {
  CALENDAR_PLATFORM_OPTIONS,
  CALENDAR_STATUS_OPTIONS,
  parseClientIdsFromSearchParam,
  parsePlatformsFromSearchParam,
  parseStatusesFromSearchParam,
} from "./calendarFilters";

const btnTriggerClass =
  "inline-flex w-full min-w-0 max-w-full items-center justify-between gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-2.5 py-2 text-left text-[12px] text-[var(--foreground)] transition-[border,background,box-shadow] duration-200 ease-out hover:border-[color-mix(in_srgb,var(--accent)_20%,var(--border))] hover:bg-[var(--background)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] data-[open]:ring-1 data-[open]:ring-[var(--accent-soft)] sm:min-w-[11.5rem] sm:max-w-[14rem]";

const labelKicker =
  "shrink-0 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]";

type CalendarPageFiltersProps = {
  clientOptions: PostsClientFilterOption[];
  /**
   * `row` (по умолчанию) — в строку, как на странице календаря.
   * `column` — в колонку (боковая панель «Актуальные посты»).
   */
  direction?: "row" | "column";
};

type DropKey = "client" | "platform" | "status";

function FilterChevron({ open }: { open: boolean }) {
  return (
    <span
      className="inline-flex shrink-0 text-[var(--muted)] transition-transform duration-200 ease-out motion-reduce:transition-none"
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
      aria-hidden
    >
      <svg
        className="size-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </span>
  );
}

function MultiSelectDropdown({
  dKey,
  open,
  onOpen,
  onClose,
  kicker,
  buttonSummary,
  children,
}: {
  dKey: DropKey;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  kicker: string;
  buttonSummary: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div
      className="relative min-w-0 sm:min-w-[11.5rem] sm:max-w-[14rem]"
      data-open={open || undefined}
    >
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-panel-${dKey}`}
        aria-label={`${kicker}. Текущее: ${buttonSummary}. Открыть список выбора`}
        data-open={open || undefined}
        onClick={() => (open ? onClose() : onOpen())}
        className={btnTriggerClass}
        title={`${kicker} — ${buttonSummary}`}
      >
        <span className="flex min-w-0 max-w-full flex-1 items-center gap-1.5">
          <span className={labelKicker} aria-hidden>
            {kicker}
          </span>
          <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-[var(--foreground)]">
            {buttonSummary}
          </span>
        </span>
        <FilterChevron open={open} />
      </button>
      <div
        id={`${id}-panel-${dKey}`}
        className={[
          "absolute left-0 right-0 top-full z-20 min-w-0 origin-top overflow-y-auto overscroll-contain rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 shadow-lg [scrollbar-gutter:stable] sm:left-auto sm:min-w-[12rem] sm:max-w-[18rem]",
          "max-h-56",
          "transform-gpu will-change-[opacity,transform]",
          "transition-[transform,opacity,visibility] duration-200 ease-out motion-reduce:transition-none",
          open
            ? "mt-1 translate-y-0 scale-100 opacity-100 [pointer-events:auto] [visibility:visible]"
            : "invisible -translate-y-0.5 scale-[0.98] opacity-0 [pointer-events:none]",
        ].join(" ")}
        role="listbox"
        aria-hidden={!open}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      >
        {children}
      </div>
    </div>
  );
}

function clientSummary(
  n: number,
  selected: PostsClientFilterOption[]
): string {
  if (n === 0) return "Все";
  if (n === 1) return selected[0]!.label.slice(0, 32) + (selected[0]!.label.length > 32 ? "…" : "");
  return `Выбрано: ${n}`;
}

function platformOrStatusSummary(n: number, labels: string[]): string {
  if (n === 0) return "Все";
  if (n === 1) return labels[0] ?? "";
  return `Выбрано: ${n}`;
}

export function CalendarPageFilters({
  clientOptions,
  direction = "row",
}: CalendarPageFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const baseId = useId();
  const [openKey, setOpenKey] = useState<DropKey | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const validClientIds = useMemo(
    () => new Set(clientOptions.map((c) => c.id)),
    [clientOptions]
  );

  const selectedClients = parseClientIdsFromSearchParam(
    searchParams.get("client") ?? undefined,
    validClientIds
  );
  const selectedPlatforms = parsePlatformsFromSearchParam(
    searchParams.get("platform") ?? undefined
  );
  const selectedStatuses = parseStatusesFromSearchParam(
    searchParams.get("status") ?? undefined
  );

  const selectedClientRows = useMemo(
    () => clientOptions.filter((c) => selectedClients.includes(c.id)),
    [clientOptions, selectedClients]
  );

  const platformLabels = useMemo(
    () => CALENDAR_PLATFORM_OPTIONS.filter((o) => selectedPlatforms.includes(o.id)).map((o) => o.label),
    [selectedPlatforms]
  );
  const statusLabels = useMemo(
    () => CALENDAR_STATUS_OPTIONS.filter((o) => selectedStatuses.includes(o.id)).map((o) => o.label),
    [selectedStatuses]
  );

  const hasFilters =
    selectedClients.length > 0 ||
    selectedPlatforms.length > 0 ||
    selectedStatuses.length > 0;

  useEffect(() => {
    if (!openKey) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (rootRef.current && !rootRef.current.contains(t)) {
        setOpenKey(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenKey(null);
    };
    document.addEventListener("mousedown", onDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [openKey]);

  function pushParams(mutate: (next: URLSearchParams) => void) {
    const next = new URLSearchParams(searchParams.toString());
    mutate(next);
    const q = next.toString();
    router.push(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }

  function toggleClient(id: string) {
    pushParams((next) => {
      const set = new Set(
        parseClientIdsFromSearchParam(
          next.get("client") ?? undefined,
          validClientIds
        )
      );
      if (set.has(id)) set.delete(id);
      else set.add(id);
      if (set.size === 0) next.delete("client");
      else next.set("client", [...set].join(","));
    });
  }

  function togglePlatform(id: (typeof CALENDAR_PLATFORM_OPTIONS)[number]["id"]) {
    pushParams((next) => {
      const set = new Set(
        parsePlatformsFromSearchParam(next.get("platform") ?? undefined)
      );
      if (set.has(id)) set.delete(id);
      else set.add(id);
      if (set.size === 0) next.delete("platform");
      else next.set("platform", [...set].join(","));
    });
  }

  function toggleStatus(
    id: (typeof CALENDAR_STATUS_OPTIONS)[number]["id"]
  ) {
    pushParams((next) => {
      const set = new Set(
        parseStatusesFromSearchParam(next.get("status") ?? undefined)
      );
      if (set.has(id)) set.delete(id);
      else set.add(id);
      if (set.size === 0) next.delete("status");
      else next.set("status", [...set].join(","));
    });
  }

  return (
    <div
      ref={rootRef}
      className={
        direction === "row"
          ? "flex w-full min-w-0 flex-wrap items-end gap-2 sm:items-center sm:gap-3"
          : "flex w-full min-w-0 flex-col gap-2.5"
      }
    >
      {clientOptions.length > 0 ? (
        <MultiSelectDropdown
          dKey="client"
          open={openKey === "client"}
          onOpen={() => setOpenKey("client")}
          onClose={() => setOpenKey(null)}
          kicker="Клиенты"
          buttonSummary={clientSummary(
            selectedClients.length,
            selectedClientRows
          )}
        >
          <ul className="space-y-0.5">
            {clientOptions.map((c) => {
              const checked = selectedClients.includes(c.id);
              const rowId = `${baseId}-cl-${c.id}`;
              return (
                <li key={c.id} role="option" aria-selected={checked}>
                  <label
                    htmlFor={rowId}
                    className="flex cursor-pointer items-start gap-2 rounded-md px-1.5 py-1 text-[11px] leading-snug text-[var(--foreground)] hover:bg-[var(--surface-elevated)]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      id={rowId}
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        toggleClient(c.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-0.5 size-3.5 shrink-0 rounded border-[var(--border)] accent-[var(--accent)]"
                    />
                    <span className="min-w-0" title={c.label}>
                      {c.label}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </MultiSelectDropdown>
      ) : (
        <div
          className="rounded-lg border border-dashed border-[var(--border)] px-2.5 py-1.5 text-[11px] text-[var(--muted)]"
        >
          Нет клиентов
        </div>
      )}

      <MultiSelectDropdown
        dKey="platform"
        open={openKey === "platform"}
        onOpen={() => setOpenKey("platform")}
        onClose={() => setOpenKey(null)}
        kicker="Площадки"
        buttonSummary={platformOrStatusSummary(
          selectedPlatforms.length,
          platformLabels
        )}
      >
        <ul className="space-y-0.5">
          {CALENDAR_PLATFORM_OPTIONS.map((opt) => {
            const checked = selectedPlatforms.includes(opt.id);
            const boxId = `${baseId}-pf-${opt.id}`;
            return (
              <li key={opt.id} role="option" aria-selected={checked}>
                <label
                  htmlFor={boxId}
                  className="flex cursor-pointer items-start gap-2 rounded-md px-1.5 py-1 text-[11px] leading-snug text-[var(--foreground)] hover:bg-[var(--surface-elevated)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    id={boxId}
                    type="checkbox"
                    className="mt-0.5 size-3.5 shrink-0 rounded border-[var(--border)] accent-[var(--accent)]"
                    checked={checked}
                    onChange={() => {
                      togglePlatform(opt.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="min-w-0">{opt.label}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </MultiSelectDropdown>

      <MultiSelectDropdown
        dKey="status"
        open={openKey === "status"}
        onOpen={() => setOpenKey("status")}
        onClose={() => setOpenKey(null)}
        kicker="Статусы"
        buttonSummary={platformOrStatusSummary(
          selectedStatuses.length,
          statusLabels
        )}
      >
        <ul className="space-y-0.5">
          {CALENDAR_STATUS_OPTIONS.map((opt) => {
            const checked = selectedStatuses.includes(opt.id);
            const boxId = `${baseId}-st-${opt.id}`;
            return (
              <li key={opt.id} role="option" aria-selected={checked}>
                <label
                  htmlFor={boxId}
                  className="flex cursor-pointer items-start gap-2 rounded-md px-1.5 py-1 text-[11px] leading-snug text-[var(--foreground)] hover:bg-[var(--surface-elevated)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    id={boxId}
                    type="checkbox"
                    className="mt-0.5 size-3.5 shrink-0 rounded border-[var(--border)] accent-[var(--accent)]"
                    checked={checked}
                    onChange={() => {
                      toggleStatus(opt.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="min-w-0">{opt.label}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </MultiSelectDropdown>

      {hasFilters ? (
        <button
          type="button"
          onClick={() => {
            setOpenKey(null);
            pushParams((next) => {
              next.delete("client");
              next.delete("platform");
              next.delete("status");
            });
          }}
          className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-2 text-[11px] font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-elevated)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          Сбросить
        </button>
      ) : null}
    </div>
  );
}
