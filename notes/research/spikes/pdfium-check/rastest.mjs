import fs from 'node:fs';
import { PDFiumLibrary } from '@hyzyla/pdfium';
import sharp from 'sharp';

const BENCH =
  '/private/tmp/claude-501/-Users-bobakemaiman-Documents-Projects-open-pdf/5e331d5c-6a77-43fd-86ee-79b06e5d14bb/scratchpad/engine-bench';
const lib = await PDFiumLibrary.init();

for (const [name, file] of [
  ['takumi', 'out-takumi-2p.pdf'],
  ['reactpdf', 'out-reactpdf-2p.pdf'],
]) {
  const doc = await lib.loadDocument(fs.readFileSync(`${BENCH}/${file}`));
  const page = doc.getPage(0);
  const img = await page.render({ scale: 2.5, render: 'bitmap' });
  await sharp(img.data, { raw: { width: img.width, height: img.height, channels: 4 } })
    .png()
    .toFile(`pdfium-${name}-p1.png`);
  console.log(`${name}: ${img.width}x${img.height} rendered`);
  doc.destroy();
}
lib.destroy();
