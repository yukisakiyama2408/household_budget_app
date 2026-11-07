import { budgetSectionHref } from "../budget-navigation";
import { analysisHref, resolveAnalysisSelection } from "../analysis-navigation";
import { parseTransactionFilters, transactionFilterParams } from "./filters";

/** Accept only known app pages and their validated parameters, never arbitrary URLs. */
export function transactionReturnTo(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/transactions";
  let url: URL;
  try { url = new URL(value, "https://app.invalid"); } catch { return "/transactions"; }
  if (url.origin !== "https://app.invalid") return "/transactions";
  if (url.pathname === "/") return "/";
  if (url.pathname === "/transactions") {
    const params = transactionFilterParams(parseTransactionFilters(url.searchParams));
    return params.size ? `/transactions?${params}` : "/transactions";
  }
  if (url.pathname === "/budget") return budgetSectionHref("budget", Object.fromEntries(url.searchParams));
  if (url.pathname === "/analysis" || url.pathname === "/analysis/reviews") {
    const section = url.pathname.endsWith("reviews") ? "reviews" : "stats";
    return analysisHref(section, resolveAnalysisSelection(Object.fromEntries(url.searchParams), section));
  }
  return "/transactions";
}


export { transactionEntryHref, transactionImportHref } from "./entry-links";
