import type { PostReviewComment } from "./postReviewTypes";
import { PUBLISH_SCHEDULE_TZ } from "@/domain/smm";

const H = 60 * 60 * 1e3;
const D = 24 * H;

/** Сдвиг от «сейчас» — нельзя выбрать время ближе (если сегодня). */
const PUBLISH_EARLY_MINUTES = 5;

function toYmdInScheduleZone(d: Date, timeZone: string = PUBLISH_SCHEDULE_TZ): string {
  return d.toLocaleDateString("sv-SE", { timeZone });
}

function toHmInScheduleZone(d: Date, timeZone: string = PUBLISH_SCHEDULE_TZ): string {
  const f = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = f.formatToParts(d);
  const ho = parts.find((p) => p.type === "hour")?.value ?? "0";
  const mo = parts.find((p) => p.type === "minute")?.value ?? "0";
  return `${ho.padStart(2, "0")}:${mo.padStart(2, "0")}`;
}

function earliestAfterBuffer(now: Date): Date {
  const d = new Date(now);
  d.setMinutes(d.getMinutes() + PUBLISH_EARLY_MINUTES, 0, 0);
  return d;
}

/** Следующий «ровный» час, не раньше `earliest`. */
function nextFullHourOnOrAfter(earliest: Date): Date {
  const t = new Date(earliest);
  t.setSeconds(0, 0);
  t.setMinutes(0, 0, 0);
  if (t < earliest) t.setHours(t.getHours() + 1, 0, 0, 0);
  return t;
}

function timeToMinutes(s: string): number {
  const p = s.split(":");
  const a = p[0] != null ? parseInt(p[0], 10) : 0;
  const b = p[1] != null ? parseInt(p[1], 10) : 0;
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return a * 60 + b;
}

function getDefaultForNow(now: Date): { date: string; time: string } {
  const t = nextFullHourOnOrAfter(earliestAfterBuffer(now));
  return { date: toYmdInScheduleZone(t), time: toHmInScheduleZone(t) };
}

/**
 * `type="date"` + `type="time"` (Europe/Moscow: следующий целый час, не раньше +5 мин от сейчас).
 */
export function getDefaultPublishSchedule(): { date: string; time: string } {
  return getDefaultForNow(new Date());
}

/** `YYYY-MM-DD` для «сегодня» по московскому календарю — `min` у `input[type=date]`. */
export function getTodayYmdString(now: Date = new Date()): string {
  return toYmdInScheduleZone(now);
}

/**
 * `min` для `input[type=time]`, если выбрана дата;
 * `undefined` — при будущем дне или при крае «+5 мин уже завтра» (состояние нормализуется).
 */
export function getMinTimeForDateField(
  ymd: string,
  now: Date = new Date()
): string | undefined {
  const today = toYmdInScheduleZone(now);
  if (ymd < today) return "23:59";
  if (ymd > today) return undefined;
  const ear = earliestAfterBuffer(now);
  if (toYmdInScheduleZone(ear) > ymd) return undefined;
  return toHmInScheduleZone(ear);
}

/** Согласовать дату/время: не раньше сегодня; сегодня — не раньше +5 мин, при смене дня — сдвиг. */
export function normalizePublishSchedule(
  s: { date: string; time: string },
  now: Date = new Date()
): { date: string; time: string } {
  if (!s.date || !s.time) return getDefaultForNow(now);
  const today = toYmdInScheduleZone(now);
  if (s.date < today) return getDefaultForNow(now);
  if (s.date > today) return s;

  const ear = earliestAfterBuffer(now);
  if (toYmdInScheduleZone(ear) > s.date) {
    return { date: toYmdInScheduleZone(ear), time: toHmInScheduleZone(ear) };
  }
  if (toYmdInScheduleZone(ear) === s.date) {
    if (timeToMinutes(s.time) < timeToMinutes(toHmInScheduleZone(ear))) {
      return { date: s.date, time: toHmInScheduleZone(ear) };
    }
  }
  return s;
}

/** «2 ч назад», «1 мин назад» относительно `nowMs`. */
export function formatTimeAgoRuFrom(at: number, nowMs: number): string {
  const d = Math.max(0, nowMs - at);
  const s = d / 1e3;
  if (s < 50) return "только что";
  const mins = Math.floor(s / 60);
  if (s < 3600) {
    return `${Math.max(1, mins)} мин назад`;
  }
  const hrs = Math.floor(s / 3600);
  if (s < 86400) {
    return `${Math.max(1, hrs)} ч назад`;
  }
  if (d < 7 * D) {
    return `${Math.max(1, Math.floor(s / 86400))} д. назад`;
  }
  return new Date(at).toLocaleString("ru", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** «2 ч назад» относительно текущего момента. */
export function formatTimeAgoRu(at: number): string {
  return formatTimeAgoRuFrom(at, Date.now());
}

export function getInitialReviewComments(): PostReviewComment[] {
  return [
    {
      id: "c1",
      side: "self",
      text: "Пожалуйста, проверьте хэштеги — не слишком ли много?",
      createdAt: Date.now() - 2 * H,
    },
    {
      id: "c2",
      side: "client",
      text: "Хэштеги хорошие, но цвет «малиновый» — замените на «вишнёвый»",
      createdAt: Date.now() - 1 * H,
    },
  ];
}
