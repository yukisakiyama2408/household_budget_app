import { getJapanToday } from "./dateUtils";
import { normalizeMonth } from "./fixed-expense-navigation";

export type AnalysisView = "monthly" | "weekly" | "yearly" | "daily";
export type AnalysisSection = "stats" | "reviews" | "checkin";
export type AnalysisParams = Record<string, string | string[] | undefined>;
export type AnalysisSelection = { view: AnalysisView; period: string; dateFrom: string; dateTo: string; label: string };
export type AnalysisPeriodOption = { value: string; label: string };

export function validAnalysisDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function shiftAnalysisDate(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function analysisWeekStart(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  return shiftAnalysisDate(value, -((date.getUTCDay() + 6) % 7));
}

function validYear(value: unknown): value is string {
  return typeof value === "string" && /^(?!0000)\d{4}$/.test(value);
}

export function resolveAnalysisSelection(params: AnalysisParams = {}, section: AnalysisSection = "stats", today = getJapanToday().date): AnalysisSelection {
  let view: AnalysisView = typeof params.view === "string" && ["monthly", "weekly", "yearly", "daily"].includes(params.view) ? params.view as AnalysisView : "monthly";
  if (section === "checkin") view = "weekly";
  if (section === "reviews" && view === "daily") view = "monthly";
  let period: string;
  if (view === "weekly") {
    let supplied = [params.period, params.week, params.weekStart].find(validAnalysisDate);
    if (!supplied && typeof params.week === "string" && /^[1-6]$/.test(params.week)) {
      const month = resolveAnalysisSelection({ ...params, view: "monthly" }, "stats", today);
      const candidate = shiftAnalysisDate(analysisWeekStart(month.dateFrom), (Number(params.week) - 1) * 7);
      if (candidate <= month.dateTo) supplied = candidate;
    }
    period = analysisWeekStart(supplied ?? today);
    const dateTo = shiftAnalysisDate(period, 6);
    return { view, period, dateFrom: period, dateTo, label: `${period.replaceAll("-", "/")}〜${dateTo.replaceAll("-", "/")}` };
  }
  if (view === "yearly") {
    period = [params.period, params.year].find(validYear) ?? today.slice(0, 4);
    return { view, period, dateFrom: `${period}-01-01`, dateTo: `${period}-12-31`, label: `${period}年` };
  }
  const numericMonth = typeof params.month === "string" && /^(0?[1-9]|1[0-2])$/.test(params.month) ? params.month.padStart(2, "0") : undefined;
  const legacyYear = validYear(params.year) ? params.year : today.slice(0, 4);
  const legacyMonth = validYear(params.year) || numericMonth ? `${legacyYear}-${numericMonth ?? (legacyYear === today.slice(0, 4) ? today.slice(5, 7) : "01")}` : undefined;
  period = [params.period, params.month, legacyMonth].map(normalizeMonth).find((value) => value !== undefined) ?? today.slice(0, 7);
  const end = new Date(`${period}-01T00:00:00Z`);
  end.setUTCMonth(end.getUTCMonth() + 1, 0);
  return { view, period, dateFrom: `${period}-01`, dateTo: end.toISOString().slice(0, 10), label: `${period.slice(0, 4)}年${Number(period.slice(5))}月` };
}

export function switchAnalysisView(selection: AnalysisSelection, view: AnalysisView): AnalysisSelection {
  const anchor = selection.dateFrom;
  const period = view === "yearly" ? anchor.slice(0, 4) : view === "weekly" ? analysisWeekStart(anchor) : anchor.slice(0, 7);
  return resolveAnalysisSelection({ view, period });
}

export function analysisHref(section: AnalysisSection, selection: AnalysisSelection): string {
  const resolved = section === "checkin" ? switchAnalysisView(selection, "weekly") : section === "reviews" && selection.view === "daily" ? switchAnalysisView(selection, "monthly") : selection;
  const path = section === "stats" ? "/analysis" : section === "reviews" ? "/analysis/reviews" : "/analysis/reviews/checkin";
  return `${path}?${new URLSearchParams({ view: resolved.view, period: resolved.period })}`;
}

export function legacyAnalysisHref(source: "monthly" | "yearly" | "daily" | "insights" | "checkin", params: AnalysisParams = {}, today = getJapanToday().date): string {
  const section = source === "checkin" ? "checkin" : source === "insights" || params.tab === "insights" ? "reviews" : "stats";
  const view = source === "daily" || source === "yearly" ? source : source === "checkin" ? "weekly" : params.view;
  return analysisHref(section, resolveAnalysisSelection({ ...params, view }, section, today));
}

export function analysisPeriodOptions(selection: AnalysisSelection, bounds: { earliest: string; latest: string } | null, today = getJapanToday().date): AnalysisPeriodOption[] {
  const earliest = bounds?.earliest && validAnalysisDate(bounds.earliest) ? bounds.earliest : today;
  const latest = bounds?.latest && validAnalysisDate(bounds.latest) && bounds.latest > today ? bounds.latest : today;
  const options = new Map<string, string>([[selection.period, selection.label]]);
  if (selection.view === "weekly") {
    for (let value = analysisWeekStart(latest); value >= analysisWeekStart(earliest); value = shiftAnalysisDate(value, -7)) {
      const option = resolveAnalysisSelection({ view: "weekly", period: value }, "stats", today);
      options.set(option.period, option.label);
    }
  } else if (selection.view === "yearly") {
    for (let year = Number(latest.slice(0, 4)); year >= Number(earliest.slice(0, 4)); year--) options.set(String(year), `${year}年`);
  } else {
    const first = Number(earliest.slice(0, 4)) * 12 + Number(earliest.slice(5, 7)) - 1;
    const last = Number(latest.slice(0, 4)) * 12 + Number(latest.slice(5, 7)) - 1;
    for (let value = last; value >= first; value--) {
      const year = Math.floor(value / 12);
      const month = value % 12 + 1;
      options.set(`${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`, `${year}年${month}月`);
    }
  }
  return [...options].sort(([a], [b]) => b.localeCompare(a)).map(([value, label]) => ({ value, label }));
}
