// Diagnostic experiments for the two takumi defects seen in the invoice:
//  A) white notch in thead band when a th has an explicit width
//  B) tr splitting across pages despite break-inside: avoid
import { writeFile } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { render } from "takumi-pdf";

const here = path.dirname(fileURLToPath(import.meta.url));
const interDir = path.join(here, "node_modules/@fontsource/inter/files");
const fonts = [
  { name: "Inter", weight: 400, data: await readFile(path.join(interDir, "inter-latin-400-normal.woff2")) },
  { name: "Inter", weight: 700, data: await readFile(path.join(interDir, "inter-latin-700-normal.woff2")) },
];

function Table({ widthOnDesc }) {
  return (
    <table tw="w-full text-[12px]" style={{ borderCollapse: "collapse" }}>
      <thead>
        <tr tw="bg-slate-100 font-bold">
          <th tw="p-2 text-left">SKU</th>
          <th tw={widthOnDesc ? "p-2 text-left w-[45%]" : "p-2 text-left"}>Description</th>
          <th tw="p-2 text-right">Qty</th>
        </tr>
      </thead>
      <tbody>
        <tr><td tw="p-2">A-1</td><td tw="p-2">Alpha</td><td tw="p-2 text-right">1</td></tr>
      </tbody>
    </table>
  );
}

// A: with and without explicit width
await writeFile("exp-a-width.pdf", await render(
  <main tw="flex flex-col gap-4">
    <span>WITH w-45%:</span>
    <Table widthOnDesc={true} />
    <span>WITHOUT w-45%:</span>
    <Table widthOnDesc={false} />
  </main>,
  { size: "a4", fonts, fontFamilies: ["Inter"] },
));

// B: rows tall enough to straddle a page break; break-inside: avoid on tr
const rows = Array.from({ length: 30 }, (_, i) => (
  <tr key={i} style={{ breakInside: "avoid" }}>
    <td tw="p-2 align-top">R{String(i + 1)}</td>
    <td tw="p-2">
      <div tw="flex flex-col">
        <span>Row {String(i + 1)} title line</span>
        <span tw="text-[10px] text-slate-500">
          Wrapping detail sentence one for the row. Wrapping detail sentence two for the
          row so the row spans several lines and can straddle a page boundary.
        </span>
      </div>
    </td>
  </tr>
));
await writeFile("exp-b-breakinside.pdf", await render(
  <table tw="w-full text-[13px]" style={{ borderCollapse: "collapse" }}>
    <thead><tr tw="bg-slate-100 font-bold"><th tw="p-2 text-left">ID</th><th tw="p-2 text-left">Description</th></tr></thead>
    <tbody>{rows}</tbody>
  </table>,
  { size: "a4", fonts, fontFamilies: ["Inter"] },
));
console.log("done");
