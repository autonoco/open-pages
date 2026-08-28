import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Source_Serif_4 } from 'next/font/google';
import './global.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-ui' });
const serif = Source_Serif_4({ subsets: ['latin'], variable: '--font-page' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-code' });

const title = 'open-pages — The web page framework built for agents';
const description =
  'Your coding agent writes web pages as React components or plain HTML. You get a live browser preview, click any element to comment, and export a static folder that deploys anywhere. MIT.';

export const metadata: Metadata = {
  title,
  description,
  metadataBase: new URL('https://openpages.sh'),
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title,
    description,
    url: 'https://openpages.sh',
    siteName: 'open-pages',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
