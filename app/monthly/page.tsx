import { redirect } from "next/navigation";
import { legacyAnalysisHref, type AnalysisParams } from "@/lib/analysis-navigation";

export default async function LegacyAnalysisPage({ searchParams }: { searchParams: Promise<AnalysisParams> }) {
  redirect(legacyAnalysisHref("monthly", await searchParams));
}
