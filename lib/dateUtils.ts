const pad = (n: number) => String(n).padStart(2, "0");
export const fmtDate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export type WeekRange = { start: string; end: string; label: string };

export function getWeeksOfMonth(year: number, month: number): WeekRange[] {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  const dow = firstDay.getDay();
  const firstMonday = new Date(firstDay);
  firstMonday.setDate(firstDay.getDate() - (dow === 0 ? 6 : dow - 1));

  const weeks: WeekRange[] = [];
  const cursor = new Date(firstMonday);

  while (cursor <= lastDay) {
    const start = fmtDate(new Date(cursor));
    const end = fmtDate(new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 6));

    const [, sm, sd] = start.split("-");
    const [, em, ed] = end.split("-");
    const label =
      sm === em
        ? `${parseInt(sm)}/${parseInt(sd)}-${parseInt(ed)}`
        : `${parseInt(sm)}/${parseInt(sd)}-${parseInt(em)}/${parseInt(ed)}`;

    weeks.push({ start, end, label });
    cursor.setDate(cursor.getDate() + 7);
  }
  return weeks;
}

export function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return fmtDate(monday);
}
