import DailyTable from "@/components/daily/DailyTable";
import { getDailyData } from "@/lib/data";

type Props = {
  searchParams: Promise<{ month?: string; year?: string }>;
};

export default async function DailyPage({ searchParams }: Props) {
  const params = await searchParams;
  const now = new Date();
  const [currentYear, currentMonth] = params.month
    ? params.month.split("-").map(Number)
    : [
        params.year ? parseInt(params.year) : now.getFullYear(),
        params.year && parseInt(params.year) !== now.getFullYear() ? 1 : now.getMonth() + 1,
      ];

  const monthlyData = await getDailyData(currentYear);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <DailyTable data={monthlyData[currentMonth - 1]} />
      </div>
    </div>
  );
}
