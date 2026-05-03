import { getGoalsWithProgress, getCategories } from "@/lib/data";
import GoalForm from "@/components/goals/GoalForm";
import GoalCard from "@/components/goals/GoalCard";

export default async function GoalsPage() {
  const [goals, categories] = await Promise.all([
    getGoalsWithProgress(),
    getCategories(),
  ]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">目標設定</h1>
        <GoalForm categories={categories} />
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm space-y-1">
          <p>目標がまだ設定されていません</p>
          <p>「目標を追加」から最初の目標を作りましょう</p>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
}
