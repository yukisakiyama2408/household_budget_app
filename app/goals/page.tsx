import GoalForm from "@/components/goals/GoalForm";
import GoalCard from "@/components/goals/GoalCard";
import GoalPlanningTools from "@/components/goals/GoalPlanningTools";
import { getCategories, getGoalsWithProgress } from "@/lib/data";
import { Target } from "lucide-react";

export default async function GoalsPage() {
  const [goals, categories] = await Promise.all([
    getGoalsWithProgress(),
    getCategories(),
  ]);
  const savingsGoals = goals.filter((goal) => goal.type === "savings");
  const expenseGoals = goals.filter((goal) => goal.type === "expense");

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/70">
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:py-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-indigo-100 text-indigo-700">
            <Target className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-950">目標</h1>
          </div>
        </div>
        <GoalForm categories={categories} />
      </div>

      <GoalPlanningTools />

      {goals.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-indigo-200 bg-white px-4 py-16 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-500"><Target className="size-5" /></div>
          <p className="mt-4 text-sm font-bold text-gray-800">最初のゴールをつくりましょう</p>
          <p className="mt-1 text-xs text-gray-500">旅行、貯蓄、毎月の支出上限などを設定できます。</p>
        </div>
      ) : (
        <>
          {savingsGoals.length > 0 && (
            <section className="space-y-4">
              <div><p className="text-xs font-bold tracking-[0.14em] text-gray-400">SAVE FOR JOY</p><h2 className="mt-1 text-lg font-bold text-gray-950">貯蓄ロードマップ</h2></div>
              <div className="grid gap-5">
                {savingsGoals.map((goal) => <GoalCard key={goal.id} goal={goal} categories={categories} />)}
              </div>
            </section>
          )}
          {expenseGoals.length > 0 && (
            <section className="space-y-4">
              <div><p className="text-xs font-bold tracking-[0.14em] text-gray-400">MONTHLY LIMIT</p><h2 className="mt-1 text-lg font-bold text-gray-950">今月の支出ルール</h2></div>
              <div className="grid gap-4 md:grid-cols-2">
                {expenseGoals.map((goal) => <GoalCard key={goal.id} goal={goal} categories={categories} />)}
              </div>
            </section>
          )}
        </>
      )}
      </div>
    </div>
  );
}
