import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { ModuleKind, ScriptTarget, transpileModule } from "typescript";
import { transactionReturnTo } from "./navigation";
import LegacyImportPage from "../../app/import/page";
import LegacyFeedbackPage from "../../app/feature-requests/page";

test("create, update and delete redirect only after a successful write and retain filters", async () => {
  let fail = false;
  const writes: string[] = [];
  const client = { from: () => ({
    insert: async () => { writes.push("insert"); return { error: fail ? { message: "write failed" } : null }; },
    update: () => ({ eq: async () => { writes.push("update"); return { error: fail ? { message: "write failed" } : null }; } }),
    delete: () => ({ eq: async () => { writes.push("delete"); return { error: fail ? { message: "write failed" } : null }; } }),
  }) };
  const imports: Record<string, unknown> = {
    "@/utils/supabase/server": { createClient: async () => client },
    "next/cache": { revalidatePath() {} },
    "next/navigation": { redirect: (target: string) => { throw new Error(`redirect:${target}`); } },
    "@/lib/transactions/navigation": { transactionReturnTo },
    "@/lib/fixed-expenses": {}, "@/lib/fixed-expense-navigation": {}, "@/lib/credit-settlements": {},
  };
  const source = readFileSync(new URL("../actions.ts", import.meta.url), "utf8");
  const { outputText } = transpileModule(source, { compilerOptions: { module: ModuleKind.CommonJS, target: ScriptTarget.ES2017 } });
  const loaded = { exports: {} };
  new Function("require", "module", "exports", outputText)((name: string) => { assert.ok(name in imports, name); return imports[name]; }, loaded, loaded.exports);
  const actions = loaded.exports as typeof import("../actions");
  const returnTo = "/transactions?month=2025-12&month=2026-01&category_id=2&needs=store";
  const form = new FormData();
  for (const [key, value] of Object.entries({ returnTo, date: "2025-12-31", content: "test", type: "expense", amount: "100", category_id: "2", store: "", pay_method: "Cash" })) form.set(key, value);
  for (const action of [() => actions.createTransaction(form), () => actions.updateTransaction(12, form), () => actions.deleteTransaction(12, returnTo)]) {
    await assert.rejects(action, { message: `redirect:${returnTo}` });
    fail = true;
    await assert.rejects(action, { message: "write failed" });
    fail = false;
  }
  assert.deepEqual(writes, ["insert", "insert", "update", "update", "delete", "delete"]);
  form.set("returnTo", "https://evil.invalid");
  await assert.rejects(() => actions.createTransaction(form), { message: "redirect:/transactions" });
});

test("legacy import and feedback URLs redirect once to their canonical destinations", () => {
  for (const [page, target] of [[LegacyImportPage, "/transactions/import"], [LegacyFeedbackPage, "/settings/feedback"]] as const) {
    assert.throws(page, (error: unknown) => {
      assert.ok(error instanceof Error && "digest" in error);
      assert.ok(String(error.digest).includes(`;${target};`));
      return true;
    });
  }
});
