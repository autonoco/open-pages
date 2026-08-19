// Isolate the intra-word gap defect: live googleFonts vs cached rehydrated fonts.
import { writeFile } from 'node:fs/promises';
import { googleFonts } from '@takumi-rs/helpers';
import { render } from 'takumi-pdf';
import { loadFonts } from './takumi-invoice.js';

const doc = (
  <main tw="flex flex-col text-[16px]">
    <h1 tw="text-[27px] font-bold">Acme Supply Co. Description credits</h1>
    <p>Accounts Payable — Description of supply credits payable applies</p>
  </main>
);

const live = await googleFonts([{ name: 'Inter', weight: [400, 700] }]);
await writeFile(
  'gap-live.pdf',
  await render(doc, { size: 'a4', fonts: live, fontFamilies: ['Inter', 'sans-serif'] }),
);

const cached = await loadFonts();
await writeFile(
  'gap-cached.pdf',
  await render(doc, { size: 'a4', fonts: cached, fontFamilies: ['Inter', 'sans-serif'] }),
);

console.log('done');
