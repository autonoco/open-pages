// Per-process benchmark worker. Fresh process = cold start.
// Usage: tsx worker.mjs <engine: reactpdf|takumi> <multiplier> <warmRuns> <outFile>
import { performance } from "node:perf_hooks";
import { writeFile } from "node:fs/promises";
import { makeItems } from "./data.mjs";

const [engine, multStr, warmStr, outFile] = process.argv.slice(2);
const mult = Number(multStr ?? 1);
const warmRuns = Number(warmStr ?? 5);
const items = makeItems(mult);

const modPath = engine === "reactpdf" ? "./invoice-reactpdf.jsx" : "./invoice-takumi.jsx";

const t0 = performance.now();
const { renderInvoice } = await import(modPath);
const tImport = performance.now() - t0;

// Cold render: first render in this process (includes lazy WASM init for takumi,
// font parse for react-pdf).
const tc0 = performance.now();
const first = await renderInvoice(items);
const coldMs = performance.now() - tc0;

const warm = [];
let last = first;
for (let i = 0; i < warmRuns; i++) {
  const tw0 = performance.now();
  last = await renderInvoice(items);
  warm.push(performance.now() - tw0);
}

if (outFile) await writeFile(outFile, last);

const avg = warm.length ? warm.reduce((a, b) => a + b, 0) / warm.length : null;
console.log(JSON.stringify({
  engine, mult, items: items.length,
  import_ms: +tImport.toFixed(1),
  cold_first_render_ms: +coldMs.toFixed(1),
  warm_ms: warm.map((x) => +x.toFixed(1)),
  warm_avg_ms: avg == null ? null : +avg.toFixed(1),
  bytes: last.length,
}));
