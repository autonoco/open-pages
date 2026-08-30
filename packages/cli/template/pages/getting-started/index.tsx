import type { PageMeta } from '@autono/open-pages';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs';

export const meta: PageMeta = {
  title: 'Welcome to open-pages',
  description: 'The web page framework built for agents.',
  createdAt: '2026-08-28T00:00:00.000Z',
};

const steps = [
  {
    id: 'describe',
    title: 'Describe',
    body: 'Tell your agent what the page is. It runs /create-page and writes the React.',
  },
  {
    id: 'preview',
    title: 'Preview',
    body: 'This workspace renders the real page in a real browser frame on every save.',
  },
  {
    id: 'annotate',
    title: 'Annotate',
    body: 'Press i, click anything, leave a note. It lands in the source as a comment marker.',
  },
  {
    id: 'ship',
    title: 'Ship',
    body: 'Your agent runs /apply-comments. open-pages export writes a static folder you can deploy anywhere.',
  },
];

export default function GettingStarted() {
  return (
    <main className="min-h-screen bg-background text-foreground antialiased">
      <section className="mx-auto max-w-3xl px-6 pt-24 pb-16">
        <Badge variant="secondary">open-pages</Badge>
        <h1 className="mt-4 text-5xl font-bold leading-[1.05] tracking-tight">
          The web page framework built for agents
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
          This page is a React component at{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]">
            pages/getting-started/index.tsx
          </code>
          . Every shadcn/ui component is already installed under <code>ui/</code>. Your agent
          composes them, the workspace previews the result live, and the export is plain HTML, CSS,
          and JS.
        </p>
        <div className="mt-8 flex gap-3">
          <Button>Primary action</Button>
          <Button variant="outline">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-24">
        <Tabs defaultValue="describe">
          <TabsList>
            {steps.map((step, i) => (
              <TabsTrigger key={step.id} value={step.id}>
                <span className="font-mono text-xs opacity-60">0{i + 1}</span>
                {step.title}
              </TabsTrigger>
            ))}
          </TabsList>
          {steps.map((step) => (
            <TabsContent key={step.id} value={step.id}>
              <p className="mt-4 min-h-[3.5rem] text-base leading-relaxed">{step.body}</p>
            </TabsContent>
          ))}
        </Tabs>

        <Card className="mt-16">
          <CardHeader>
            <CardTitle>Try the loop</CardTitle>
            <CardDescription>Three things to do in the next two minutes.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-muted-foreground">
              <li>1. Change any text in this file and watch the preview update.</li>
              <li>2. Switch the viewport to mobile in the toolbar. The layout is responsive.</li>
              <li>
                3. Ask your agent for something bigger: a landing page, a pricing table, a whole new
                page with <code className="font-mono">/create-page</code>.
              </li>
            </ol>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
