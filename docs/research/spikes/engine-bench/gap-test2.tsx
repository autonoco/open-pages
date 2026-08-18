// Gap isolation round 2: full local TTF (Arial) and googleFonts Roboto.
import { readFile, writeFile } from "node:fs/promises";
import { googleFonts } from "@takumi-rs/helpers";
import { render } from "takumi-pdf";

const doc = (family: string) => (
  <main tw="flex flex-col text-[16px]" style={{ fontFamily: family }}>
    <h1 tw="text-[27px] font-bold">Acme Supply Co. Description credits</h1>
    <p>Accounts Payable — Description of supply credits payable applies</p>
  </main>
);

// 1. Full single-file TTF from the OS (no subsetting pipeline)
const arial = await readFile("/System/Library/Fonts/Supplemental/Arial.ttf");
const arialBold = await readFile("/System/Library/Fonts/Supplemental/Arial Bold.ttf");
await writeFile(
  "gap-arial.pdf",
  await render(doc("Arial"), {
    size: "a4",
    fonts: [
      { name: "Arial", weight: 400, data: arial },
      { name: "Arial", weight: 700, data: arialBold },
    ],
  }),
);

// 2. Different Google family through the same subset pipeline
const roboto = await googleFonts([{ name: "Roboto", weight: [400, 700] }]);
await writeFile("gap-roboto.pdf", await render(doc("Roboto"), { size: "a4", fonts: roboto }));

console.log("done");
