import type { DocMeta, Page } from '@open-pdf/core';

export const meta: DocMeta = {
  title: 'Hot Deck',
  createdAt: '2025-12-31T00:00:00.000Z',
};

const fill = {
  width: '100%',
  height: '100%',
  background: '#151022',
  color: '#efe9fb',
  padding: 120,
  fontFamily: 'system-ui, sans-serif',
} as const;

const Only: Page = () => (
  <div style={fill}>
    <h1 style={{ fontSize: 96, margin: 0 }}>Hot swap headline</h1>
    <p style={{ fontSize: 40 }}>Hot swap body copy</p>
  </div>
);

export default [Only] satisfies Page[];
