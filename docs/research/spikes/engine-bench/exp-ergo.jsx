import { render } from 'takumi-pdf';

try {
  const pdf = await render(
    <div tw="flex">
      <span>count: {42}</span>
      <div>{3.14}</div>
    </div>,
    { size: 'a4' },
  );
  console.log('takumi number child: OK, bytes', pdf.length);
} catch (e) {
  console.log('takumi number child FAILED:', String(e).slice(0, 200));
}
try {
  const pdf = await render(<div>no fonts at all</div>, { size: 'a4' });
  console.log('takumi no fonts: OK, bytes', pdf.length);
} catch (e) {
  console.log('takumi no fonts FAILED:', String(e).slice(0, 300));
}

import { Document, Page, renderToBuffer, View } from '@react-pdf/renderer';

try {
  const buf = await renderToBuffer(
    <Document>
      <Page size="A4">
        <View>bare string</View>
      </Page>
    </Document>,
  );
  console.log('react-pdf bare string: OK, bytes', buf.length);
} catch (e) {
  console.log('react-pdf bare string FAILED:', String(e).slice(0, 200));
}
