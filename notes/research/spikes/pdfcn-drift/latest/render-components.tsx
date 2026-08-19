/**
 * Spike: exercise Heading, Card, Text, Table components directly on takumi-pdf latest.
 */
import { writeFileSync } from 'node:fs';

import { fromJsx } from '@takumi-rs/helpers/jsx';
import { render } from 'takumi-pdf';

import { PdfCard } from '@/registry/bases/takumi/components/card/card';
import { Heading } from '@/registry/bases/takumi/components/heading/heading';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/registry/bases/takumi/components/table/table';
import { Text } from '@/registry/bases/takumi/components/text/text';
import { PdfcnThemeProvider } from '@/registry/bases/takumi/components/theme-provider';
import { Document, Page, View } from '@/registry/bases/takumi/lib/pdf-primitives';

const Demo = () => (
  <PdfcnThemeProvider>
    <Document title="Component smoke test">
      <Page size="A4" style={{ backgroundColor: '#ffffff', padding: 40 }}>
        <Heading level={1}>Component smoke test</Heading>
        <Text>Body text via pdfcn Text component.</Text>
        <PdfCard title="Card title">
          <Text noMargin>Card content renders.</Text>
        </PdfCard>
        <View style={{ marginTop: 16 }}>
          <Table>
            <TableHeader>
              <TableRow header>
                <TableCell>Col A</TableCell>
                <TableCell align="right">Col B</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Row 1</TableCell>
                <TableCell align="right">42</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </View>
      </Page>
    </Document>
  </PdfcnThemeProvider>
);

const t0 = performance.now();
const { node, stylesheets } = await fromJsx(<Demo />);
const pdf = await render(node, {
  margin: { bottom: 0, left: 0, right: 0, top: 0 },
  size: 'a4',
  stylesheets,
});
const t1 = performance.now();
writeFileSync('components-latest.pdf', Buffer.from(pdf));
console.log(
  JSON.stringify({ bytes: (pdf as Uint8Array).byteLength, totalMs: Number((t1 - t0).toFixed(1)) }),
);
