// One-time: fetch Inter 400/700 via the takumi helper and cache the full
// FontSubset[] structure to disk (data as base64) so benchmark runs never
// touch the network.

import { mkdir, writeFile } from 'node:fs/promises';
import { googleFonts } from '@takumi-rs/helpers';

const fonts = await googleFonts([{ name: 'Inter', weight: [400, 700] }]);
await mkdir('fonts', { recursive: true });
const serial = await Promise.all(
  fonts.map(async (f: any) => ({
    ...f,
    data: Buffer.from(await f.data()).toString('base64'), // data is a lazy loader fn
  })),
);
await writeFile('fonts/inter.json', JSON.stringify(serial));
console.log(serial.map((f: any) => `${f.name} w=${f.weight} b64len=${f.data.length}`).join('\n'));
