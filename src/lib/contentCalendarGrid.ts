/** Локальная календарная дата в формате YYYY-MM-DD (без UTC-сдвига). */
export function toLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type CalendarDayCell = {
  ymd: string;
  inMonth: boolean;
  dayNumber: number;
};

/** 6×7, неделя с понедельника; `monthIndex` 0 = январь. */
export function getMonthGridCells(
  year: number,
  monthIndex: number
): CalendarDayCell[] {
  const first = new Date(year, monthIndex, 1);
  const dow = first.getDay();
  const offsetMon = dow === 0 ? 6 : dow - 1;
  const start = new Date(year, monthIndex, 1 - offsetMon);
  const cells: CalendarDayCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push({
      ymd: toLocalYmd(d),
      inMonth: d.getMonth() === monthIndex,
      dayNumber: d.getDate(),
    });
  }
  return cells;
}

/**
 * Понедельник–воскресенье недели, в которой лежит указанный день месяца
 * (`dayInMonth` 1–31, `monthIndex` 0–11).
 */
export function getWeekGridCells(
  year: number,
  monthIndex: number,
  dayInMonth: number
): CalendarDayCell[] {
  const lastD = new Date(year, monthIndex + 1, 0).getDate();
  const d = Math.min(Math.max(dayInMonth, 1), lastD);
  const anchor = new Date(year, monthIndex, d);
  const dow = anchor.getDay();
  const offsetMon = dow === 0 ? 6 : dow - 1;
  const start = new Date(anchor);
  start.setDate(anchor.getDate() - offsetMon);
  const cells: CalendarDayCell[] = [];
  for (let i = 0; i < 7; i++) {
    const x = new Date(start);
    x.setDate(start.getDate() + i);
    cells.push({
      ymd: toLocalYmd(x),
      inMonth: x.getMonth() === monthIndex,
      dayNumber: x.getDate(),
    });
  }
  return cells;
}
