import { getWeekSummaryForDates, getCheckinForWeek } from "@/lib/data";
import CheckinView from "@/components/checkin/CheckinView";

function fmtDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function getWeekBounds(date: Date): { start: string; end: string } {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setDate(d.getDate() + diff);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: fmtDate(start), end: fmtDate(end) };
}

export default async function CheckinPage() {
  const now = new Date();
  const currentWeek = getWeekBounds(now);

  const prevStartDate = new Date(currentWeek.start);
  prevStartDate.setDate(prevStartDate.getDate() - 7);
  const prevEndDate = new Date(currentWeek.end);
  prevEndDate.setDate(prevEndDate.getDate() - 7);
  const prevWeek = { start: fmtDate(prevStartDate), end: fmtDate(prevEndDate) };

  const [currentData, prevData, alreadyCheckedIn] = await Promise.all([
    getWeekSummaryForDates(currentWeek.start, currentWeek.end),
    getWeekSummaryForDates(prevWeek.start, prevWeek.end),
    getCheckinForWeek(currentWeek.start),
  ]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-xl font-bold">週次チェックイン</h1>
      <CheckinView
        currentWeek={currentData}
        prevWeek={prevData}
        alreadyCheckedIn={alreadyCheckedIn}
        weekStart={currentWeek.start}
      />
    </div>
  );
}
