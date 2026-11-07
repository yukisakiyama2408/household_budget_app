import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import ts from "typescript";

const require = createRequire(import.meta.url);
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const baseline = process.argv[2];
assert.ok(baseline, "Provide the pre-split source directory");
const file = readFileSync(resolve(baseline, "components/insights/ChatGPTPrompt.tsx"), "utf8");
const ast = ts.createSourceFile("baseline.tsx", file, ts.ScriptTarget.ES2017, true, ts.ScriptKind.TSX);
const declaration = ast.statements.filter(ts.isVariableStatement).flatMap((node) => [...node.declarationList.declarations]).find((node) => node.name.getText(ast) === "TEMPLATES");
assert.ok(declaration?.initializer);
function load(source, imports = {}) {
  const loaded = { exports: {} };
  const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } });
  new Function("require", "module", "exports", outputText)((name) => {
    if (name in imports) return imports[name];
    assert.ok(["react", "react/jsx-runtime", "lucide-react"].includes(name), name);
    return require(name);
  }, loaded, loaded.exports);
  return loaded.exports;
}
const oldTemplates = load(`export const TEMPLATES = ${declaration.initializer.getText(ast)};`).TEMPLATES;
const budgetTemplates = load(readFileSync("lib/prompts/budget.ts", "utf8"));
const templates = load(readFileSync("lib/prompts/templates.ts", "utf8"), { "./budget": budgetTemplates });
assert.deepEqual(templates.TEMPLATES, oldTemplates, "All template text, metadata, and order must be identical");
const oldComponent = load(readFileSync(resolve(baseline, "components/budget/BudgetReviewTools.tsx"), "utf8"), { "@/components/insights/ChatGPTPrompt": { TEMPLATES: oldTemplates } }).default;
const newComponent = load(readFileSync("components/budget/BudgetReviewTools.tsx", "utf8"), { "@/lib/prompts/budget": budgetTemplates }).default;
let cases = 0;
for (const view of ["monthly", "weekly"]) for (const withPrior of [false, true]) {
  const props = { view, targetLabel: "過去の対象期間", ...(withPrior ? { priorAnalysis: { id: 1, title: "振り返り", content: "内容", periodLabel: "過去の対象期間", advices: ["案"] } } : {}) };
  assert.equal(renderToStaticMarkup(React.createElement(newComponent, props)), renderToStaticMarkup(React.createElement(oldComponent, props)), `${view}/${withPrior}`);
  cases++;
}
console.log(JSON.stringify({ templates: oldTemplates.length, templateHash: createHash("sha256").update(JSON.stringify(oldTemplates)).digest("hex"), identicalBudgetMarkupCases: cases }));
