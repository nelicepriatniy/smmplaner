"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useId, useMemo } from "react";
import type { PostsClientFilterOption } from "@/components/posts/PostsClientFilter";
import {
  CALENDAR_PLATFORM_OPTIONS,
  CALENDAR_STATUS_OPTIONS,
  parseClientIdsFromSearchParam,
  parsePlatformsFromSearchParam,
  parseStatusesFromSearchParam,
} from "./calendarFilters";

const sectionTitle =
  "text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]";

type CalendarPageFiltersProps = {
  clientOptions: PostsClientFilterOption[];
};

export function CalendarPageFilters({ clientOptions }: CalendarPageFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const baseId = useId();

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

  const hasFilters =
    selectedClients.length > 0 ||
    selectedPlatforms.length > 0 ||
    selectedStatuses.length > 0;

  function pushParams(mutate: (next: URLSearchParams) => void) {
    const next = new URLSearchParams(searchParams.toString());
    mutate(next);
    const q = next.toString();
    router.push(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }

  function toggleClient(id: string) {
    pushParams((next) => {
      const set = new Set(
        parseClientIdsFromSearchParam(next.get("client") ?? undefined, validClientIds)
      );
      if (set.has(id)) set.delete(id);
      else set.add(id);
      if (set.size === 0) next.delete("client");
      else next.set("client", [...set].join(","));
    });
  }

  function togglePlatform(id: (typeof CALENDAR_PLATFORM_OPTIONS)[number]["id"]) {
    pushParams((next) => {
      const set = new Set(parsePlatformsFromSearchParam(next.get("platform") ?? undefined));
      if (set.has(id)) set.delete(id);
      else set.add(id);
      if (set.size === 0) next.delete("platform");
      else next.set("platform", [...set].join(","));
    });
  }

  function toggleStatus(id: (typeof CALENDAR_STATUS_OPTIONS)[number]["id"]) {
    pushParams((next) => {
      const set = new Set(parseStatusesFromSearchParam(next.get("status") ?? undefined));
      if (set.has(id)) set.delete(id);
      else set.add(id);
      if (set.size === 0) next.delete("status");
      else next.set("status", [...set].join(","));
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 space-y-3.5">
        <div role="group" aria-label="Клиенты">
        <h3 className={sectionTitle}>Клиенты</h3>
        <p className="mt-0.5 text-[10px] text-[var(--muted)]">Пусто — все</p>
        {clientOptions.length === 0 ? (
          <p className="mt-1.5 text-[11px] text-[var(--muted)]">Нет клиентов</p>
        ) : (
          <ul className="mt-1.5 space-y-0.5">
            {clientOptions.map((c) => {
              const checked = selectedClients.includes(c.id);
              const rowId = `${baseId}-cl-${c.id}`;
              return (
                <li key={c.id}>
                  <label
                    htmlFor={rowId}
                    className="flex cursor-pointer items-start gap-2 rounded-md px-1 py-1 text-[11px] leading-snug text-[var(--foreground)] hover:bg-[var(--surface-elevated)]"
                  >
                    <input
                      id={rowId}
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleClient(c.id)}
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
        )}
        </div>

        <div role="group" aria-label="Платформы">
        <h3 className={sectionTitle}>Платформы</h3>
        <p className="mt-0.5 text-[10px] text-[var(--muted)]">Пусто — все</p>
        <ul className="mt-1.5 space-y-0.5">
          {CALENDAR_PLATFORM_OPTIONS.map((opt) => {
            const checked = selectedPlatforms.includes(opt.id);
            const boxId = `${baseId}-pf-${opt.id}`;
            return (
              <li key={opt.id}>
                <label
                  htmlFor={boxId}
                  className="flex cursor-pointer items-start gap-2 rounded-md px-1 py-1 text-[11px] leading-snug text-[var(--foreground)] hover:bg-[var(--surface-elevated)]"
                >
                  <input
                    id={boxId}
                    type="checkbox"
                    className="mt-0.5 size-3.5 shrink-0 rounded border-[var(--border)] accent-[var(--accent)]"
                    checked={checked}
                    onChange={() => togglePlatform(opt.id)}
                  />
                  <span className="min-w-0">{opt.label}</span>
                </label>
              </li>
            );
          })}
        </ul>
        </div>

        <div role="group" aria-label="Статусы постов">
        <h3 className={sectionTitle}>Статусы</h3>
        <p className="mt-0.5 text-[10px] text-[var(--muted)]">Пусто — все</p>
        <ul className="mt-1.5 space-y-0.5">
          {CALENDAR_STATUS_OPTIONS.map((opt) => {
            const checked = selectedStatuses.includes(opt.id);
            const boxId = `${baseId}-st-${opt.id}`;
            return (
              <li key={opt.id}>
                <label
                  htmlFor={boxId}
                  className="flex cursor-pointer items-start gap-2 rounded-md px-1 py-1 text-[11px] leading-snug text-[var(--foreground)] hover:bg-[var(--surface-elevated)]"
                >
                  <input
                    id={boxId}
                    type="checkbox"
                    className="mt-0.5 size-3.5 shrink-0 rounded border-[var(--border)] accent-[var(--accent)]"
                    checked={checked}
                    onChange={() => toggleStatus(opt.id)}
                  />
                  <span className="min-w-0">{opt.label}</span>
                </label>
              </li>
            );
          })}
        </ul>
        </div>
      </div>

      <div className="min-h-0 flex-1" aria-hidden />

      {hasFilters ? (
        <button
          type="button"
          onClick={() =>
            pushParams((next) => {
              next.delete("client");
              next.delete("platform");
              next.delete("status");
            })
          }
          className="w-full shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-2 py-1.5 text-[11px] font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--border)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          Сбросить фильтры
        </button>
      ) : null}
    </div>
  );
}
