import { readFileSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { runInNewContext } from "node:vm";
import { resolve } from "node:path";

// Production build entry files, not a browser/Lighthouse measurement.
const routes = ["/", "/transactions", "/budget", "/analysis", "/analysis/reviews", "/transactions/import", "/settings/feedback"];
const result = { measurement: "production-entry-js-files", routes: {} };
for (const route of routes) {
  const file = `.next/server/app${route === "/" ? "" : route}/page_client-reference-manifest.js`;
  const context = {};
  runInNewContext(readFileSync(file, "utf8"), context);
  const manifest = Object.values(context.__RSC_MANIFEST)[0];
  const files = [...new Set(Object.values(manifest.entryJSFiles).flat())].filter((name) => name.endsWith(".js"));
  const sizes = files.map((name) => {
    const bytes = readFileSync(resolve(".next", name));
    return { file: name, bytes: bytes.length, gzipBytes: gzipSync(bytes).length };
  });
  result.routes[route] = { bytes: sizes.reduce((sum, item) => sum + item.bytes, 0), gzipBytes: sizes.reduce((sum, item) => sum + item.gzipBytes, 0), files: sizes };
}
if (process.argv[2]) writeFileSync(process.argv[2], `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(Object.fromEntries(Object.entries(result.routes).map(([route, value]) => [route, { bytes: value.bytes, gzipBytes: value.gzipBytes }]))));
