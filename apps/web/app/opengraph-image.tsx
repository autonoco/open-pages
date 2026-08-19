import { ImageResponse } from 'next/og';

export const dynamic = 'force-static';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt =
  'open-pdf — a typeset PDF sheet with an inspector comment pin: “make the headline bigger”, applied by your agent.';

// Fetched at build time only (static export); text= keeps each subset tiny.
async function loadGoogleFont(family: string, weight: number, text: string) {
  const css = await (
    await fetch(
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&text=${encodeURIComponent(text)}`,
    )
  ).text();
  const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
  if (!url) throw new Error(`No TTF URL for ${family} ${weight}`);
  return (await fetch(url)).arrayBuffer();
}

const HEADLINE_1 = 'The PDF framework';
const HEADLINE_2 = 'built for agents.';
const SERIF_600 = `open-pdfA FRAMEWORK${HEADLINE_1}${HEADLINE_2}SIGN HERE TO BEGIN`;
const SERIF_400 =
  '“make the headline bigger”applied by your agent · re-rendered in 24msOP-0001 · PDF 1.7';
const MONO_400 = 'h1 · index.tsx:17$ npx @open-pdf/cli init openpdf.sh';

export default async function OgImage() {
  const [serif600, serif400, mono400] = await Promise.all([
    loadGoogleFont('Source Serif 4', 600, SERIF_600),
    loadGoogleFont('Source Serif 4', 400, SERIF_400),
    loadGoogleFont('JetBrains Mono', 400, MONO_400),
  ]);

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        backgroundColor: '#131311',
        backgroundImage: 'radial-gradient(720px 480px at 62% 40%, #1d1d1a, #131311)',
        fontFamily: 'Source Serif 4',
      }}
    >
      {/* Brand lockup */}
      <div
        style={{
          position: 'absolute',
          left: 64,
          top: 60,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 32 32"
          fill="none"
          role="img"
          aria-label="open-pdf mark"
        >
          <path
            d="M7 5.5A2.5 2.5 0 0 1 9.5 3H19l6.5 6.5V26.5A2.5 2.5 0 0 1 23 29H9.5A2.5 2.5 0 0 1 7 26.5V5.5Z"
            stroke="#F5F1E8"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M19 3v6.5h6.5L19 3Z"
            fill="#E05A3A"
            stroke="#E05A3A"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M11.5 16h9M11.5 20.5h9M11.5 25h5.5"
            stroke="#F5F1E8"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 24, color: '#a8a49b' }}>
          openpdf.sh
        </div>
      </div>

      {/* The sheet — bleeds off the bottom edge like a real page */}
      <div
        style={{
          position: 'absolute',
          left: 430,
          top: 64,
          width: 710,
          height: 640,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          padding: '56px 64px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.5), 0 12px 48px rgba(0,0,0,0.55)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            borderBottom: '1px solid #e4e1da',
            paddingBottom: 20,
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 600, color: '#1a1917' }}>open-pdf</div>
          <div style={{ fontSize: 16, color: '#6b675f' }}>OP-0001 · PDF 1.7</div>
        </div>

        <div
          style={{
            marginTop: 44,
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: 4,
            color: '#c63a21',
          }}
        >
          A FRAMEWORK
        </div>

        {/* Headline with the inspect outline */}
        <div
          style={{
            marginTop: 18,
            display: 'flex',
            flexDirection: 'column',
            alignSelf: 'flex-start',
            border: '2.5px solid rgba(59,130,246,0.75)',
            borderRadius: 4,
            padding: '10px 18px 16px 18px',
          }}
        >
          <div style={{ fontSize: 54, fontWeight: 600, lineHeight: 1.12, color: '#1a1917' }}>
            {HEADLINE_1}
          </div>
          <div style={{ fontSize: 54, fontWeight: 600, lineHeight: 1.12, color: '#1a1917' }}>
            {HEADLINE_2}
          </div>
        </div>

        <div
          style={{
            marginTop: 46,
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: 3,
            color: '#6b675f',
          }}
        >
          SIGN HERE TO BEGIN
        </div>
        <div
          style={{
            marginTop: 14,
            display: 'flex',
            alignItems: 'baseline',
            gap: 14,
            fontFamily: 'JetBrains Mono',
            fontSize: 24,
            color: '#1a1917',
          }}
        >
          <div style={{ color: '#c63a21' }}>$</div>
          <div>npx @open-pdf/cli init</div>
        </div>
      </div>

      {/* Connector from the pin to the inspected headline */}
      <div
        style={{
          position: 'absolute',
          left: 366,
          top: 318,
          width: 146,
          height: 2,
          backgroundColor: 'rgba(59,130,246,0.6)',
        }}
      />

      {/* The inspector comment pin */}
      <div
        style={{
          position: 'absolute',
          left: 64,
          top: 244,
          width: 302,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#fffdf7',
          border: '1px solid #d8d4cb',
          borderRadius: 10,
          padding: '18px 20px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
          transform: 'rotate(-0.5deg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 9, height: 9, borderRadius: 9, backgroundColor: '#3b82f6' }} />
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 14, color: '#57534a' }}>
            h1 · index.tsx:17
          </div>
        </div>
        <div style={{ marginTop: 10, fontSize: 21, lineHeight: 1.3, color: '#33302a' }}>
          “make the headline bigger”
        </div>
        <div
          style={{
            marginTop: 14,
            borderTop: '1px solid #eae6dc',
            paddingTop: 10,
            fontSize: 14,
            color: '#8a8578',
          }}
        >
          applied by your agent · re-rendered in 24ms
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: 'Source Serif 4', data: serif600, weight: 600, style: 'normal' },
        { name: 'Source Serif 4', data: serif400, weight: 400, style: 'normal' },
        { name: 'JetBrains Mono', data: mono400, weight: 400, style: 'normal' },
      ],
    },
  );
}
