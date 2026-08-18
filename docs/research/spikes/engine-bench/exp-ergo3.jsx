import { writeFileSync } from "node:fs";
import { render } from "takumi-pdf";
writeFileSync("exp-nofonts.pdf", await render(<div>no fonts at all</div>, { size: "a4" }));
