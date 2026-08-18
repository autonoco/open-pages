// Smoke test: render each engine's invoice once, write PDFs, print page counts.
import { writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import { makeItems } from "./invoice-data.js";

const k2 = Number(process.env.K2 ?? 1); // multiplier for the "2-page" doc
const k20 = Number(process.env.K20 ?? 14); // multiplier for the "20-page" doc

const { renderInvoice: renderReact } = await import("./react-pdf-invoice.js");
const { renderInvoice: renderTakumi, loadFonts } = await import("./takumi-invoice.js");
const fonts = await loadFonts();

for (const [label, k] of [["2p", k2], ["20p", k20]] as const) {
  const items = makeItems(k);
  const r = await renderReact(items);
  await writeFile(`out-react-${label}.pdf`, r);
  const t = await renderTakumi(items, fonts);
  await writeFile(`out-takumi-${label}.pdf`, t);
  for (const f of [`out-react-${label}.pdf`, `out-takumi-${label}.pdf`]) {
    const info = execSync(`pdfinfo ${f} | grep -E "^Pages|^File size"`).toString().trim();
    console.log(f, "rows=" + items.length, "|", info.replace(/\s+/g, " "));
  }
}
