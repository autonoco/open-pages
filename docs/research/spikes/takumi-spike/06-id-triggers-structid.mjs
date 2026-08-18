// Spike 6: Confirm the `id` prop opts a node into a StructElem /ID(Un.<tree-path>) entry,
// and that /K MCIDs + /Pg give per-page geometry hooks readable via pdf.js marked content.
import { writeFile, readFile } from "node:fs/promises";
import zlib from "node:zlib";
import { render } from "takumi-pdf";
import { createElement as h } from "react";

function section(i) {
  return h(
    "section",
    { id: `s${i}`, style: i > 0 ? { breakBefore: "page" } : undefined },
    h("h1", { id: `s${i}-h` }, `Chapter ${i + 1}`),
    h("p", { id: `s${i}-p` }, `Body ${i + 1} `.repeat(10)),
    h(
      "div",
      { id: `s${i}-row`, style: { display: "flex", justifyContent: "space-between" } },
      h("span", { id: `s${i}-l` }, "L"),
      h("span", { id: `s${i}-r` }, "R"),
    ),
  );
}

const doc = h("main", { id: "root" }, section(0), section(1));
const pdf = await render(doc, { size: "a4" });
const path = new URL("./out-ids-all.pdf", import.meta.url);
await writeFile(path, pdf);

const buf = await readFile(path);
let out = "";
let i = 0;
while ((i = buf.indexOf("stream", i)) !== -1) {
  const start = buf.indexOf("\n", i) + 1;
  const end = buf.indexOf("endstream", start);
  if (end === -1) break;
  try {
    out += zlib.inflateSync(buf.subarray(start, end)).toString("latin1") + "\n";
  } catch {}
  i = end;
}
for (const m of out.match(/<<[^<>]*StructElem[^>]*(?:<<[^>]*>>)?[^>]*>>/g) ?? []) console.log(m);
