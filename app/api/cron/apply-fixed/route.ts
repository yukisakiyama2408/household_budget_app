import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { applyFixedExpenses } from "@/lib/fixed-expenses";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const result = await applyFixedExpenses(year, month);

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/fixed");

  return NextResponse.json({ year, month, ...result });
}
