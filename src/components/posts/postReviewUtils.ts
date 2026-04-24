import type { PostReviewComment } from "./postReviewTypes";

const H = 60 * 60 * 1e3;
const D = 24 * H;

/** Сдвиг от «сейчас» — нельзя выбрать время ближе (если сегодня). */
const PUBLISH_EARLY_MINUTES = 30;

function toYmdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toHmLocal(d: Date): string {
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${min}`;
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
  return { date: toYmdLocal(t), time: toHmLocal(t) };
}

/** `type="date"` + `type="time"` (локаль: следующий целый час, но не раньше чем +30 мин). */
export function getDefaultPublishSchedule(): { date: string; time: string } {
  return getDefaultForNow(new Date());
}

/** `YYYY-MM-DD` для сегодня (локаль) — `min` у `input[type=date]`. */
export function getTodayYmdString(now: Date = new Date()): string {
  return toYmdLocal(now);
}

/**
 * `min` для `input[type=time]`, если выбрана дата;
 * `undefined` — при будущем дне или при крае «+30 мин уже завтра» (состояние нормализуется).
 */
export function getMinTimeForDateField(
  ymd: string,
  now: Date = new Date()
): string | undefined {
  const today = toYmdLocal(now);
  if (ymd < today) return "23:59";
  if (ymd > today) return undefined;
  const ear = earliestAfterBuffer(now);
  if (toYmdLocal(ear) > ymd) return undefined;
  return toHmLocal(ear);
}

/** Согласовать дату/время: не раньше сегодня; сегодня — не раньше +30 мин, при смене дня — сдвиг. */
export function normalizePublishSchedule(
  s: { date: string; time: string },
  now: Date = new Date()
): { date: string; time: string } {
  if (!s.date || !s.time) return getDefaultForNow(now);
  const today = toYmdLocal(now);
  if (s.date < today) return getDefaultForNow(now);
  if (s.date > today) return s;

  const ear = earliestAfterBuffer(now);
  if (toYmdLocal(ear) > s.date) {
    return { date: toYmdLocal(ear), time: toHmLocal(ear) };
  }
  if (toYmdLocal(ear) === s.date) {
    if (timeToMinutes(s.time) < timeToMinutes(toHmLocal(ear))) {
      return { date: s.date, time: toHmLocal(ear) };
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
