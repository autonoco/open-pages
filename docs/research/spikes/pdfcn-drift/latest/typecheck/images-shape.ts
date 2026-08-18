// Verifies the pdfcn route's images option shape against takumi-pdf 0.11.1 types.
import type { RenderOptions } from "takumi-pdf";
const opts: RenderOptions = {
  images: { sources: [{ data: new Uint8Array(), src: "/favicon.png" }] },
  margin: { bottom: 0, left: 0, right: 0, top: 0 },
  size: "a4",
  stylesheets: [],
};
export default opts;
