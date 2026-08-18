/**
 * Spike: render pdfcn's invoice-minimal block to PDF via takumi-pdf.
 * Mirrors pdfcn's own render route (app/api/pdf/takumi/route.tsx):
 *   fromJsx(<Doc />) -> render(node, { size, margin, stylesheets })
 */
import { writeFileSync } from "node:fs";

import { fromJsx } from "@takumi-rs/helpers/jsx";
import { render } from "takumi-pdf";

import { InvoiceMinimalDocument } from "@/registry/bases/takumi/blocks/invoice-minimal/invoice-minimal";

const out = process.argv[2] ?? "invoice-minimal.pdf";

const t0 = performance.now();
const { node, stylesheets } = await fromJsx(<InvoiceMinimalDocument />);
const t1 = performance.now();

const pdf = await render(node, {
  margin: { bottom: 0, left: 0, right: 0, top: 0 },
  size: "a4",
  stylesheets,
});
const t2 = performance.now();

writeFileSync(out, Buffer.from(pdf));

console.log(
  JSON.stringify({
    bytes: (pdf as Uint8Array).byteLength,
    fromJsxMs: Number((t1 - t0).toFixed(1)),
    out,
    renderMs: Number((t2 - t1).toFixed(1)),
    totalMs: Number((t2 - t0).toFixed(1)),
  }),
);
