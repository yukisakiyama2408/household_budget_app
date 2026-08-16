import GoalForm from "@/components/goals/GoalForm";
import GoalCard from "@/components/goals/GoalCard";
import { getCategories, getGoalsWithProgress } from "@/lib/data";

export default async function GoalsPage() {
  const [goals, categories] = await Promise.all([
    getGoalsWithProgress(),
    getCategories(),
  ]);
  const savingsGoals = goals.filter((goal) => goal.type === "savings");
  const expenseGoals = goals.filter((goal) => goal.type === "expense");

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-950">目標</h1>
          <p className="mt-1 text-sm text-gray-500">貯蓄と支出上限を設定し、予算づくりへ反映します。</p>
        </div>
        <GoalForm categories={categories} />
      </div>

      {goals.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-white px-4 py-12 text-center">
          <p className="text-sm font-medium text-gray-700">目標がまだありません</p>
          <p className="mt-1 text-xs text-gray-500">右上の「目標を追加」から最初の目標を登録してください。</p>
        </div>
      ) : (
        <>
          {savingsGoals.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-gray-900">貯蓄目標</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {savingsGoals.map((goal) => <GoalCard key={goal.id} goal={goal} categories={categories} />)}
              </div>
            </section>
          )}
          {expenseGoals.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-gray-900">支出上限目標</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {expenseGoals.map((goal) => <GoalCard key={goal.id} goal={goal} categories={categories} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
