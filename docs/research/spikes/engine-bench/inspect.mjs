// PDF inspection with pdfjs-dist: page count, selectable text, per-page text,
// right-alignment check on numeric columns, footer presence.
// Usage: node inspect.mjs <file.pdf>
import { readFile } from "node:fs/promises";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const file = process.argv[2];
const data = new Uint8Array(await readFile(file));
const doc = await getDocument({ data, useSystemFonts: true }).promise;

const report = { file, pages: doc.numPages, perPage: [] };
const moneyRe = /^\$[\d,]+\.\d{2}$/;

for (let p = 1; p <= doc.numPages; p++) {
  const page = await doc.getPage(p);
  const tc = await page.getTextContent();
  const items = tc.items.filter((it) => it.str && it.str.trim().length);
  const strings = items.map((it) => it.str);
  const text = strings.join(" ");
  // right edges of currency-valued strings, clustered to detect column alignment
  const moneyEdges = items
    .filter((it) => moneyRe.test(it.str.trim()))
    .map((it) => +(it.transform[4] + it.width).toFixed(2));
  // cluster within 2pt
  const clusters = [];
  for (const e of [...moneyEdges].sort((a, b) => a - b)) {
    const c = clusters.find((c) => Math.abs(c.center - e) < 2.5);
    if (c) { c.vals.push(e); c.center = c.vals.reduce((a, b) => a + b) / c.vals.length; }
    else clusters.push({ center: e, vals: [e] });
  }
  const footerMatch = text.match(/Page\s+(\d+)\s+of\s+(\d+)/);
  report.perPage.push({
    page: p,
    textItems: items.length,
    chars: text.length,
    footer: footerMatch ? footerMatch[0] : null,
    moneyValues: moneyEdges.length,
    moneyRightEdgeClusters: clusters.map((c) => ({
      x: +c.center.toFixed(2), n: c.vals.length,
      maxDev: +Math.max(...c.vals.map((v) => Math.abs(v - c.center))).toFixed(3),
    })),
    firstStrings: strings.slice(0, 12),
    lastStrings: strings.slice(-8),
  });
}
console.log(JSON.stringify(report, null, 2));
