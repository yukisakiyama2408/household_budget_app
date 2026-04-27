import DailyTable from "@/components/daily/DailyTable";
import YearSelector from "@/components/yearly/YearSelector";
import { getDailyData } from "@/lib/data";

type Props = {
  searchParams: Promise<{ year?: string }>;
};

export default async function DailyPage({ searchParams }: Props) {
  const { year } = await searchParams;
  const currentYear = year ? parseInt(year) : new Date().getFullYear();

  const monthlyData = await getDailyData(currentYear);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full px-4 py-8 space-y-6">
        <div className="max-w-5xl mx-auto">
          <YearSelector year={currentYear} />
        </div>
        <div className="max-w-full mx-auto space-y-2">
          {monthlyData.map((data) => (
            <DailyTable key={`${data.year}-${data.month}`} data={data} />
          ))}
        </div>
      </div>
    </div>
  );
}
