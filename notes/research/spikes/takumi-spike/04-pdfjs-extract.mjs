// Spike 4: Fallback inspector path — pdfjs-dist getTextContent + getStructTree on Takumi output.
// Q: do text items carry usable positions, and can marked content link struct tree -> geometry?
import { readFile } from 'node:fs/promises';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const data = new Uint8Array(await readFile(new URL('./out-report.pdf', import.meta.url)));
const doc = await getDocument({ data }).promise;
console.log('numPages:', doc.numPages);

for (let p = 1; p <= doc.numPages; p++) {
  const page = await doc.getPage(p);
  const view = page.view; // [x0, y0, x1, y1] in PDF points
  console.log(`\n=== PAGE ${p} view=${JSON.stringify(view)} ===`);

  const tc = await page.getTextContent({ includeMarkedContent: true });
  for (const item of tc.items) {
    if (item.type === 'beginMarkedContentProps' || item.type === 'beginMarkedContent') {
      console.log(`  [MC-BEGIN tag=${item.tag} id=${item.id ?? ''}]`);
    } else if (item.type === 'endMarkedContent') {
      console.log(`  [MC-END]`);
    } else if (item.str !== undefined) {
      const [a, b, c, d, e, f] = item.transform;
      console.log(
        `  text "${item.str.slice(0, 40)}" x=${e.toFixed(1)} y=${f.toFixed(1)} w=${item.width.toFixed(1)} h=${item.height.toFixed(1)} font=${item.fontName}`,
      );
    }
  }

  const st = await page.getStructTree();
  console.log('  structTree:', JSON.stringify(st, null, 1)?.split('\n').join('\n  '));
}
await doc.destroy();
