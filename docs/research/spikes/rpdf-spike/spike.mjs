import React from 'react';
import rpdf from '@react-pdf/renderer';
const { pdf, Document, Page, View, Text } = rpdf;
const e = React.createElement;

const doc = e(Document, null,
  e(Page, { size: 'A4', style: { padding: 40 } },
    e(View, { 'data-loc': '12:5', style: { marginBottom: 10, padding: 8 } },
      e(Text, { 'data-loc': '13:7', style: { fontSize: 14 } }, 'hello world')
    ),
    e(Text, { 'data-loc': '16:3' }, 'second paragraph')
  )
);

const instance = pdf(doc);
console.log('instance keys:', Object.keys(instance));

// Does the public instance expose the container / element tree?
if (instance.container) {
  console.log('container.document exists:', !!instance.container.document);
}

// Try the layout package directly on the reconciled tree
const layoutMod = await import('@react-pdf/layout');
const layoutDocument = layoutMod.default ?? layoutMod;
console.log('layout export type:', typeof layoutDocument);

// Render to buffer first so container.document is populated
await instance.toBuffer();

const docNode = instance.container?.document;
if (!docNode) {
  console.log('NO ACCESS to container.document via public instance');
  process.exit(0);
}
console.log('doc node keys:', Object.keys(docNode));

// Run layout ourselves to inspect boxes+props
const FontStore = (await import('@react-pdf/font')).default;
const fontStore = new FontStore.constructor ? new (FontStore)() : null;
let laid;
try {
  laid = await layoutDocument(docNode, fontStore ?? undefined);
} catch (err) {
  console.log('layoutDocument direct call failed:', err.message);
}
if (laid) {
  const walk = (n, d = 0) => {
    const loc = n.props?.['data-loc'];
    const box = n.box ? `box=(${Math.round(n.box.left)},${Math.round(n.box.top)},${Math.round(n.box.width)}x${Math.round(n.box.height)})` : 'no-box';
    console.log(' '.repeat(d * 2) + `${n.type} ${loc ? 'data-loc=' + loc : ''} ${box}`);
    (n.children || []).forEach((c) => walk(c, d + 1));
  };
  walk(laid);
}
