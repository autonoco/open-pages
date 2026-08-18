import { writeFileSync } from "node:fs";
import { Document, Page, View, renderToBuffer } from "@react-pdf/renderer";
const buf = await renderToBuffer(<Document><Page size="A4"><View>bare string</View></Page></Document>);
writeFileSync("exp-bare.pdf", buf);
