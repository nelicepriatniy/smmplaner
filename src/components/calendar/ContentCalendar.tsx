"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import {
  type ClientRecord,
  type PostDraftRecord,
  type PostDraftStatus,
} from "@/domain/smm";
import {
  getMonthGridCells,
  getWeekGridCells,
  toLocalYmd,
  type CalendarDayCell,
} from "@/lib/contentCalendarGrid";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] as const;

type ViewMode = "month" | "week";

const BORDER_BY_STATUS: Record<PostDraftStatus, string> = {
  draft: "var(--post-status-draft-border)",
  in_review: "var(--post-status-in-review-border)",
  scheduled: "var(--post-status-scheduled-border)",
  published: "var(--post-status-published-border)",
  rejected: "var(--post-status-rejected-border)",
};

const viewToggleClass =
  "inline-flex items-center overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-0.5 text-[12px] font-medium";
const viewToggleBtn = (on: boolean) =>
  `rounded-md px-2.5 py-1 transition-colors ${
    on
      ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm"
      : "text-[var(--muted)] hover:text-[var(--foreground)]"
  }`;

const createPostClass =
  "inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-3.5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] dark:text-[#12141a]";

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

function parseYmdFromSearch(
  sp: { get: (k: string) => string | null } | null,
  fallback: { year: number; monthIndex: number }
) {
  if (!sp) return fallback;
  const yq = sp.get("y");
  const mq = sp.get("m");
  let year = fallback.year;
  let monthIndex = fallback.monthIndex;
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

function parseCalendarStateFromSearch(
  sp: { get: (k: string) => string | null } | null,
  def: { year: number; monthIndex: number; day: number; view: ViewMode }
) {
  const ymd = parseYmdFromSearch(sp, { year: def.year, monthIndex: def.monthIndex });
  if (!sp) {
    return { ...ymd, day: def.day, view: def.view };
  }
  const vq = sp.get("view");
  const view: ViewMode = vq === "week" ? "week" : "month";
  let day = def.day;
  const dq = sp.get("d");
  if (dq != null) {
    const n = Number.parseInt(dq, 10);
    if (Number.isFinite(n) && n >= 1 && n <= 31) day = n;
  }
  const lastD = new Date(ymd.year, ymd.monthIndex + 1, 0).getDate();
  day = Math.min(Math.max(1, day), lastD);
  return { ...ymd, day, view };
}

function formatWeekRangeTitle(cells: CalendarDayCell[]) {
  if (cells.length < 2) return "";
  const a = new Date(cells[0]!.ymd);
  const b = new Date(cells[6]!.ymd);
  const sm =
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
  if (sm) {
    return `${a.getDate()}–${b.getDate()} ${new Intl.DateTimeFormat("ru-RU", {
      month: "long",
    }).format(a)} ${a.getFullYear()}`;
  }
  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(d);
  return `${fmt(a)} — ${fmt(b)} ${b.getFullYear()}`;
}

function navLabel(view: ViewMode) {
  return view === "week" ? "период" : "месяц";
}

export function ContentCalendar({
  posts,
  clients,
  defaultYear,
  defaultMonthIndex,
  filtersSlot,
}: {
  posts: PostDraftRecord[];
  clients: ClientRecord[];
  defaultYear: number;
  defaultMonthIndex: number;
  /** Строка фильтров — над сеткой календаря. */
  filtersSlot?: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const defaultDay = useMemo(() => {
    const t = new Date();
    if (
      t.getFullYear() === defaultYear &&
      t.getMonth() === defaultMonthIndex
    ) {
      return t.getDate();
    }
    return 1;
  }, [defaultYear, defaultMonthIndex]);

  const [year, setYear] = useState(defaultYear);
  const [monthIndex, setMonthIndex] = useState(defaultMonthIndex);
  const [dayInMonth, setDayInMonth] = useState(defaultDay);
  const [viewMode, setViewMode] = useState<ViewMode>("month");

  const defSync = useMemo(
    () => ({
      year: defaultYear,
      monthIndex: defaultMonthIndex,
      day: defaultDay,
      view: "month" as ViewMode,
    }),
    [defaultYear, defaultMonthIndex, defaultDay]
  );

  const replaceCalendarUrl = useCallback(
    (patch: (p: URLSearchParams) => void) => {
      const p = new URLSearchParams(searchParams.toString());
      patch(p);
      const q = p.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useLayoutEffect(() => {
    if (
      searchParams.get("y") == null &&
      searchParams.get("m") == null &&
      searchParams.get("view") == null &&
      searchParams.get("d") == null
    ) {
      return;
    }
    const ns = parseCalendarStateFromSearch(searchParams, defSync);
    setYear(ns.year);
    setMonthIndex(ns.monthIndex);
    setDayInMonth(ns.day);
    setViewMode(ns.view);
  }, [searchParams, defSync]);

  const postsByYmd = useMemo(() => groupPostsByYmd(posts), [posts]);

  const monthTitle = useMemo(
    () =>
      new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(
        new Date(year, monthIndex, 1)
      ),
    [year, monthIndex]
  );

  const weekGrid = useMemo(
    () => getWeekGridCells(year, monthIndex, dayInMonth),
    [year, monthIndex, dayInMonth]
  );

  const weekTitle = useMemo(
    () => (weekGrid.length > 0 ? formatWeekRangeTitle(weekGrid) : ""),
    [weekGrid]
  );

  const monthGrid = useMemo(
    () => getMonthGridCells(year, monthIndex),
    [year, monthIndex]
  );

  const displayCells = viewMode === "week" ? weekGrid : monthGrid;

  const periodLabel = viewMode === "week" ? weekTitle : monthTitle;

  const returnToForPostEdit = useMemo(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("y", String(year));
    next.set("m", String(monthIndex));
    if (viewMode === "week") {
      next.set("view", "week");
      next.set("d", String(dayInMonth));
    }
    const q = next.toString();
    return q ? `${pathname}?${q}` : pathname;
  }, [pathname, searchParams, year, monthIndex, dayInMonth, viewMode]);

  const createPostHref = useMemo(
    () => `/posts/new?returnTo=${encodeURIComponent(returnToForPostEdit)}`,
    [returnToForPostEdit]
  );

  const todayYmd = toLocalYmd(new Date());

  const shiftByView = (delta: number) => {
    if (viewMode === "week") {
      const a = new Date(year, monthIndex, dayInMonth);
      a.setDate(a.getDate() + delta * 7);
      const y = a.getFullYear();
      const m = a.getMonth();
      const d = a.getDate();
      setYear(y);
      setMonthIndex(m);
      setDayInMonth(d);
      replaceCalendarUrl((p) => {
        p.set("y", String(y));
        p.set("m", String(m));
        p.set("d", String(d));
        p.set("view", "week");
      });
    } else {
      const d0 = new Date(year, monthIndex + delta, 1);
      const y2 = d0.getFullYear();
      const m2 = d0.getMonth();
      setYear(y2);
      setMonthIndex(m2);
      setDayInMonth(1);
      replaceCalendarUrl((p) => {
        p.set("y", String(y2));
        p.set("m", String(m2));
        p.delete("d");
        p.delete("view");
      });
    }
  };

  const goView = (next: ViewMode) => {
    if (next === viewMode) return;
    if (next === "week") {
      const now = new Date();
      let d = dayInMonth;
      if (year === now.getFullYear() && monthIndex === now.getMonth()) {
        d = now.getDate();
      }
      setViewMode("week");
      setDayInMonth(d);
      replaceCalendarUrl((p) => {
        p.set("y", String(year));
        p.set("m", String(monthIndex));
        p.set("d", String(d));
        p.set("view", "week");
      });
    } else {
      setViewMode("month");
      setDayInMonth(1);
      replaceCalendarUrl((p) => {
        p.set("y", String(year));
        p.set("m", String(monthIndex));
        p.delete("d");
        p.delete("view");
      });
    }
  };

  const goToToday = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();
    setYear(y);
    setMonthIndex(m);
    if (viewMode === "week") {
      setDayInMonth(d);
      replaceCalendarUrl((p) => {
        p.set("y", String(y));
        p.set("m", String(m));
        p.set("d", String(d));
        p.set("view", "week");
      });
    } else {
      setDayInMonth(d);
      replaceCalendarUrl((p) => {
        p.set("y", String(y));
        p.set("m", String(m));
        p.delete("d");
        p.delete("view");
      });
    }
  };

  const navPrev = `Предыдущий ${navLabel(viewMode)}`;
  const navNext = `Следующий ${navLabel(viewMode)}`;

  const minH = viewMode === "week" ? "min-h-[168px] sm:min-h-[200px]" : "min-h-[104px] sm:min-h-[120px]";

  const renderDayBlock = (cell: CalendarDayCell) => {
    const dayPosts = postsByYmd.get(cell.ymd) ?? [];
    const isToday = cell.ymd === todayYmd;
    return (
      <div
        key={cell.ymd}
        role="gridcell"
        className={`flex min-h-0 flex-col bg-[var(--surface)] p-1 ${minH} sm:p-1.5 ${
          viewMode === "week" || cell.inMonth
            ? ""
            : "opacity-[0.42]"
        } ${
          isToday
            ? "bg-[color-mix(in_srgb,var(--accent)_14%,var(--surface))] ring-2 ring-inset ring-[var(--accent)]"
            : ""
        }`}
        aria-current={isToday ? "date" : undefined}
      >
        <span
          className={`mb-1 inline-flex size-6 items-center justify-center rounded-md text-[12px] tabular-nums ${
            viewMode === "week" || cell.inMonth
              ? "font-medium text-[var(--foreground)]"
              : "text-[var(--muted)]"
          } ${
            isToday
              ? "bg-[var(--accent)] font-semibold text-white dark:text-[#12141a]"
              : ""
          }`}
        >
          {cell.dayNumber}
        </span>
        <ul className="flex min-h-0 flex-1 flex-row flex-wrap content-start gap-1 overflow-y-auto">
          {dayPosts.map((post) => {
            const clientRow = clients.find((c) => c.id === post.clientId);
            const clientName = clientRow?.fullName?.trim() || "Клиент";
            const borderColor = BORDER_BY_STATUS[post.status];
            const t = timeShort(post.publishTime);
            const title = `${t} · ${clientName}`;

            return (
              <li key={post.id} className="min-w-0 max-w-full">
                <Link
                  href={`/posts/${post.id}/edit?returnTo=${encodeURIComponent(returnToForPostEdit)}`}
                  title={title}
                  className="inline-flex w-max max-w-full min-w-0 items-baseline gap-x-1 rounded border border-solid bg-[var(--surface-elevated)] p-[5px] text-left text-[9px] leading-none text-[var(--foreground)] transition-opacity hover:opacity-90 sm:text-[10px]"
                  style={{ borderColor }}
                >
                  <span className="shrink-0 font-medium tabular-nums text-[var(--muted)]">
                    {t}
                  </span>
                  <span className="min-w-0 truncate font-medium">{clientName}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  const calendarGrid = (
    <div
      className={
        viewMode === "week"
          ? "grid min-h-0 grid-cols-7 gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)] [grid-template-rows:auto_minmax(0,1fr)]"
          : "grid auto-rows-min grid-cols-7 gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)]"
      }
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
      {displayCells.map((cell) => renderDayBlock(cell))}
    </div>
  );

  return (
    <div className="space-y-4">
      {filtersSlot ? (
        <div className="w-full min-w-0 border-b border-[var(--border)] pb-3">
          {filtersSlot}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
          <h2 className="text-[17px] font-semibold capitalize tracking-tight text-[var(--foreground)] sm:text-[19px]">
            {periodLabel}
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => shiftByView(-1)}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-1.5 text-[13px] font-medium text-[var(--foreground)] outline-offset-2 transition-colors hover:bg-[var(--surface)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              aria-label={navPrev}
            >
              ←
            </button>
            <button
              type="button"
              onClick={goToToday}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--foreground)] outline-offset-2 transition-colors hover:border-[color-mix(in_srgb,var(--accent)_30%,var(--border))] hover:bg-[var(--surface-elevated)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              aria-label="Перейти к сегодняшнему дню"
            >
              Сегодня
            </button>
            <button
              type="button"
              onClick={() => shiftByView(1)}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-1.5 text-[13px] font-medium text-[var(--foreground)] outline-offset-2 transition-colors hover:bg-[var(--surface)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              aria-label={navNext}
            >
              →
            </button>
          </div>
        </div>
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
          <div
            className={viewToggleClass}
            role="group"
            aria-label="Показ: месяц или неделя"
          >
            <button
              type="button"
              onClick={() => goView("month")}
              className={viewToggleBtn(viewMode === "month")}
            >
              Месяц
            </button>
            <button
              type="button"
              onClick={() => goView("week")}
              className={viewToggleBtn(viewMode === "week")}
            >
              Неделя
            </button>
          </div>
          <Link
            href={createPostHref}
            className={createPostClass}
            prefetch
          >
            Создать пост
          </Link>
        </div>
      </div>

      <div className="min-w-0 overflow-x-auto">{calendarGrid}</div>

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
        className="size-3 shrink-0 rounded-sm border-2 border-solid bg-[var(--surface-elevated)]"
        style={{ borderColor: BORDER_BY_STATUS[statusKey] }}
        aria-hidden
      />
      {label}
    </span>
  );
}
