// pdfjs-dist inspection: page count, selectable text, footer check, and a
// canvas render of takumi page 1 (third rasterizer opinion).
import { readFile, writeFile } from "node:fs/promises";
import { createCanvas } from "@napi-rs/canvas";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

async function inspect(file: string) {
  const data = new Uint8Array(await readFile(file));
  const doc = await getDocument({ data, useSystemFonts: false }).promise;
  const out: any = { file, pages: doc.numPages, bytes: data.length };
  const texts: string[] = [];
  for (let p = 1; p <= Math.min(doc.numPages, 2); p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    texts.push(tc.items.map((i: any) => i.str).join(" ").replace(/\s+/g, " "));
  }
  out.page1TextLen = texts[0]?.length ?? 0;
  out.supplyIntact = texts.every((t) => t.includes("Supply"));
  out.footerP1 = /Page\s*1\s*of\s*\d+/.test(texts[0] ?? "");
  out.footerP2 = /Page\s*2\s*of\s*\d+/.test(texts[1] ?? "");
  out.sample = (texts[0] ?? "").slice(0, 160);
  await (doc as any).cleanup?.();
  return out;
}

for (const f of ["out-react-2p.pdf", "out-takumi-2p.pdf", "out-react-20p.pdf", "out-takumi-20p.pdf"]) {
  console.log(JSON.stringify(await inspect(f)));
}

// pdfjs canvas render of takumi page 1
const data = new Uint8Array(await readFile("out-takumi-2p.pdf"));
const doc = await getDocument({ data, useSystemFonts: false }).promise;
const page = await doc.getPage(1);
const viewport = page.getViewport({ scale: 1.5 });
const canvas = createCanvas(viewport.width, viewport.height);
const ctx = canvas.getContext("2d");
await page.render({ canvasContext: ctx as any, viewport }).promise;
await writeFile("png/takumi-pdfjs-p1.png", canvas.toBuffer("image/png"));
console.log("pdfjs render written");
await (doc as any).cleanup?.();
