import { Agents } from '@/components/landing/agents';
import { Anatomy } from '@/components/landing/anatomy';
import { Assets } from '@/components/landing/assets';
import { FAQ, faqs } from '@/components/landing/faq';
import { Footer } from '@/components/landing/footer';
import { StripeBand } from '@/components/landing/frame';
import { GetStarted } from '@/components/landing/get-started';
import { Hero } from '@/components/landing/hero';
import { HowItWorks } from '@/components/landing/how-it-works';
import { Inspector } from '@/components/landing/inspector';
import { LiveDemo } from '@/components/landing/live-demo';
import { Nav } from '@/components/landing/nav';
import { PromptComposer } from '@/components/landing/prompt-composer';
import { ScrollReveal } from '@/components/landing/scroll-reveal';
import { UsedBy } from '@/components/landing/used-by';
import { fetchGitHubStars, formatStarCount } from '@/lib/github';
import { appName, gitConfig, siteUrl } from '@/lib/shared';

const repoUrl = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;
const description =
  'A React-first doc framework authored by AI agents. Each page is arbitrary code on a 1920×1080 canvas — versioned, reviewable, yours.';

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: appName,
    url: siteUrl,
    description,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: appName,
    url: siteUrl,
    logo: `${siteUrl}/open-pdf.png`,
    sameAs: [
      repoUrl,
      'https://www.npmjs.com/package/@open-pdf/core',
      'https://www.npmjs.com/package/@open-pdf/cli',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: appName,
    description,
    codeRepository: repoUrl,
    programmingLanguage: 'TypeScript',
    url: siteUrl,
    license: `${repoUrl}/blob/${gitConfig.branch}/LICENSE`,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: appName,
    description,
    url: siteUrl,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web, macOS, Linux, Windows',
    softwareRequirements: 'Node.js, React',
    license: `${repoUrl}/blob/${gitConfig.branch}/LICENSE`,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'Author a doc deck with open-pdf',
    description:
      'Scaffold an open-pdf workspace, ask an AI agent to draft docs, then iterate visually in the browser.',
    totalTime: 'PT2M',
    supply: [
      { '@type': 'HowToSupply', name: 'Node.js 18+' },
      { '@type': 'HowToSupply', name: 'An AI coding agent (Claude Code, Cursor, Codex, …)' },
    ],
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: 'Spin up a workspace',
        text: 'Run npx @open-pdf/cli init my-deck to scaffold the doc workspace. Every future deck lives inside it.',
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: 'Ask your agent',
        text: 'Use a slash command like /create-doc and your agent drafts docs as arbitrary React components.',
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: 'Edit, comment, apply',
        text: 'Click any element to tweak it visually, or leave an @pdf-comment marker and run /apply-comments to let the agent rewrite the source.',
      },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  },
];

export default async function HomePage() {
  const stars = await fetchGitHubStars();
  const githubStars = stars !== null ? formatStarCount(stars) : null;

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD payload is built from static, server-only constants
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Nav githubStars={githubStars} />
      <ScrollReveal />
      <main className="relative flex-1">
        <Hero />
        <LiveDemo />
        <PromptComposer />
        <StripeBand />
        <HowItWorks />
        <Anatomy />
        <Inspector />
        <Assets />
        <Agents />
        <UsedBy />
        <FAQ />
        <StripeBand />
        <GetStarted />
      </main>
      <Footer />
    </>
  );
}
