"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useLayoutEffect, useMemo, useState } from "react";
import {
  POST_DRAFT_STATUS_LABELS,
  type ClientRecord,
  type PostDraftRecord,
  type PostDraftStatus,
} from "@/data/mockDb";
import { getMonthGridCells, toLocalYmd } from "@/lib/contentCalendarGrid";
/** Демо-якорь: апрель 2026 совпадает с сидами в mockDb. */
const INITIAL_YEAR = 2026;
const INITIAL_MONTH_INDEX = 3;

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] as const;

const BORDER_BY_STATUS: Record<PostDraftStatus, string> = {
  draft: "var(--post-status-draft-border)",
  in_review: "var(--post-status-in-review-border)",
  scheduled: "var(--post-status-scheduled-border)",
  published: "var(--post-status-published-border)",
  rejected: "var(--post-status-rejected-border)",
};

const POST_TYPE_ABBR: Record<PostDraftRecord["postType"], string> = {
  feed: "Лента",
  photo: "Фото",
  reels: "Рилс",
  stories: "Сторис",
};

function timeShort(time: string) {
  return time.length >= 5 ? time.slice(0, 5) : time;
}

function groupPostsByYmd(posts: PostDraftRecord[]) {
  const map = new Map<string, PostDraftRecord[]>();
  for (const p of posts) {
    const list = map.get(p.publishDate);
    if (list) list.push(p);
    else map.set(p.publishDate, [p]);
  }
  for (const list of map.values()) {
    list.sort((a, b) => timeShort(a.publishTime).localeCompare(timeShort(b.publishTime)));
  }
  return map;
}

function parseYmdFromSearch(sp: { get: (k: string) => string | null } | null) {
  if (!sp) return { year: INITIAL_YEAR, monthIndex: INITIAL_MONTH_INDEX };
  const yq = sp.get("y");
  const mq = sp.get("m");
  let year = INITIAL_YEAR;
  let monthIndex = INITIAL_MONTH_INDEX;
  if (yq != null) {
    const n = Number.parseInt(yq, 10);
    if (Number.isFinite(n) && n >= 2000 && n < 2100) year = n;
  }
  if (mq != null) {
    const n = Number.parseInt(mq, 10);
    if (Number.isFinite(n) && n >= 0 && n <= 11) monthIndex = n;
  }
  return { year, monthIndex };
}

export function ContentCalendar({
  posts,
  clients,
}: {
  posts: PostDraftRecord[];
  clients: ClientRecord[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [year, setYear] = useState(INITIAL_YEAR);
  const [monthIndex, setMonthIndex] = useState(INITIAL_MONTH_INDEX);

  useLayoutEffect(() => {
    const yq = searchParams.get("y");
    const mq = searchParams.get("m");
    if (yq == null && mq == null) return;
    const { year: y, monthIndex: m } = parseYmdFromSearch(searchParams);
    setYear(y);
    setMonthIndex(m);
  }, [searchParams]);

  const clientById = useMemo(
    () => Object.fromEntries(clients.map((c) => [c.id, c])),
    [clients]
  );

  /** Скрывать @ник в ячейке, если в данных только один клиент (страница карточки). */
  const showClientInSlot = useMemo(() => {
    const ids = new Set(posts.map((p) => p.clientId));
    return ids.size > 1;
  }, [posts]);

  const postsByYmd = useMemo(() => groupPostsByYmd(posts), [posts]);

  const grid = useMemo(() => getMonthGridCells(year, monthIndex), [year, monthIndex]);

  const monthTitle = useMemo(
    () =>
      new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(
        new Date(year, monthIndex, 1)
      ),
    [year, monthIndex]
  );

  const returnToForPostEdit = useMemo(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("y", String(year));
    next.set("m", String(monthIndex));
    const q = next.toString();
    return q ? `${pathname}?${q}` : pathname;
  }, [pathname, searchParams, year, monthIndex]);

  const todayYmd = useMemo(() => toLocalYmd(new Date()), []);

  function shiftMonth(delta: number) {
    const d = new Date(year, monthIndex + delta, 1);
    setYear(d.getFullYear());
    setMonthIndex(d.getMonth());
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[17px] font-semibold capitalize tracking-tight text-[var(--foreground)]">
          {monthTitle}
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-1.5 text-[13px] font-medium text-[var(--foreground)] outline-offset-2 transition-colors hover:bg-[var(--surface)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            aria-label="Предыдущий месяц"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-1.5 text-[13px] font-medium text-[var(--foreground)] outline-offset-2 transition-colors hover:bg-[var(--surface)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            aria-label="Следующий месяц"
          >
            →
          </button>
        </div>
      </div>

      <div
        className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)]"
        role="grid"
        aria-label="Календарь публикаций"
      >
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="bg-[var(--surface)] px-1 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]"
            role="columnheader"
          >
            {d}
          </div>
        ))}
        {grid.map((cell) => {
          const dayPosts = postsByYmd.get(cell.ymd) ?? [];
          const isToday = cell.ymd === todayYmd;
          return (
            <div
              key={cell.ymd}
              role="gridcell"
              className={`flex min-h-[104px] flex-col bg-[var(--surface)] p-1 sm:min-h-[120px] sm:p-1.5 ${
                cell.inMonth ? "" : "opacity-[0.42]"
              } ${isToday ? "ring-1 ring-inset ring-[var(--accent-soft)]" : ""}`}
            >
              <span
                className={`mb-1 inline-flex size-6 items-center justify-center rounded-md text-[12px] tabular-nums ${
                  cell.inMonth
                    ? "font-medium text-[var(--foreground)]"
                    : "text-[var(--muted)]"
                } ${isToday ? "bg-[var(--accent-soft)] text-[var(--foreground)]" : ""}`}
              >
                {cell.dayNumber}
              </span>
              <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
                {dayPosts.map((post) => {
                  const client = clientById[post.clientId];
                  const label = client?.instagramUsername ?? post.clientId;
                  const borderColor = BORDER_BY_STATUS[post.status];
                  const captionLine =
                    post.caption.split("\n").find((l) => l.trim())?.slice(0, 140) ?? "";
                  const timePart = `${POST_DRAFT_STATUS_LABELS[post.status]} · ${timeShort(
                    post.publishTime
                  )}`;
                  const title = showClientInSlot
                    ? `${timePart} · @${label}\n${captionLine}`
                    : `${timePart}\n${captionLine}`;

                  return (
                    <li key={post.id}>
                      <Link
                        href={`/posts/${post.id}/edit?returnTo=${encodeURIComponent(returnToForPostEdit)}`}
                        title={title}
                        className="block rounded-md border border-solid bg-[var(--surface-elevated)] px-1 py-0.5 text-left text-[10px] leading-snug text-[var(--foreground)] transition-opacity hover:opacity-90 sm:px-1.5 sm:text-[11px]"
                        style={{ borderColor }}
                      >
                        <span className="font-semibold tabular-nums text-[var(--muted)]">
                          {timeShort(post.publishTime)}
                        </span>
                        {showClientInSlot ? (
                          <span className="text-[var(--foreground)]"> @{label}</span>
                        ) : null}
                        <span className="mt-0.5 block truncate text-[var(--muted)]">
                          {POST_TYPE_ABBR[post.postType]}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-[var(--muted)]">
        <LegendItem statusKey="draft" label="Черновик" />
        <LegendItem statusKey="in_review" label="На рассмотрении" />
        <LegendItem statusKey="scheduled" label="Запланирован" />
        <LegendItem statusKey="published" label="Опубликован" />
        <LegendItem statusKey="rejected" label="Отклонён" />
      </div>
    </div>
  );
}

function LegendItem({
  statusKey,
  label,
}: {
  statusKey: PostDraftStatus;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="size-2.5 shrink-0 rounded-sm border border-solid bg-[var(--surface-elevated)]"
        style={{ borderColor: BORDER_BY_STATUS[statusKey] }}
        aria-hidden
      />
      {label}
    </span>
  );
}
