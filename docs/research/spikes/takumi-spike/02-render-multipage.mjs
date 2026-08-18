// Spike 2: Render a 3-page PDF with forced page breaks; keep data-loc props on nodes.
import { writeFile } from "node:fs/promises";
import { render } from "takumi-pdf";
import { createElement as h } from "react";

function section(i) {
  return h(
    "section",
    {
      "data-loc": `src/Report.tsx:${10 + i}:5`,
      style: i > 0 ? { breakBefore: "page" } : undefined,
    },
    h("h1", { "data-loc": `src/Report.tsx:${11 + i}:7` }, `Chapter ${i + 1}: Findings`),
    h(
      "p",
      { "data-loc": `src/Report.tsx:${12 + i}:7` },
      `UNIQUE-SNIPPET-CH${i + 1} This chapter body text is unique enough to match back to source. `.repeat(3),
    ),
    h(
      "div",
      { "data-loc": `src/Report.tsx:${13 + i}:7`, style: { display: "flex", justifyContent: "space-between", borderTop: "1px solid #ccc", paddingTop: 8 } },
      h("span", { "data-loc": `src/Report.tsx:${14 + i}:9` }, `Left cell ${i + 1}`),
      h("span", { "data-loc": `src/Report.tsx:${15 + i}:9` }, `Right cell ${i + 1}`),
    ),
  );
}

const doc = h("main", { "data-loc": "src/Report.tsx:5:3" }, section(0), section(1), section(2));

const pdf = await render(doc, {
  size: "a4",
  metadata: { title: "Spike report", creationDate: "2026-08-17" },
});

await writeFile(new URL("./out-report.pdf", import.meta.url), pdf);
console.log("wrote out-report.pdf", pdf.length, "bytes");
