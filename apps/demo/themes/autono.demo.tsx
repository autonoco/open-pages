import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/ui/accordion';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { Field, FieldDescription, FieldLabel } from '@/ui/field';
import { Input } from '@/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs';

const services = [
  {
    title: 'Agents',
    body: 'Research, ops, and support agents that run inside the tools your team already uses.',
  },
  {
    title: 'Automations',
    body: 'The handoffs between your systems, done by software that reads the way a person would.',
  },
  {
    title: 'Products',
    body: 'Full-stack builds where the agent is the product, shipped with the observability to trust it.',
  },
];

const engagements = [
  { client: 'Beyond', scope: 'Matching agent', status: 'Live', owner: 'Atlas' },
  { client: 'Heroship', scope: 'Intake automation', status: 'In build', owner: 'Ledger' },
  { client: 'Debut Capital', scope: 'Diligence briefs', status: 'Scoping', owner: 'Quill' },
  { client: 'Gritsee', scope: 'Support triage', status: 'Live', owner: 'Atlas' },
];

const faqs = [
  {
    q: 'How long does a first engagement take?',
    a: 'Two to six weeks. The first week is a scoped pilot with a measurable outcome; we only continue if it lands.',
  },
  {
    q: 'Do you build on our stack?',
    a: 'Yes. Agents run where your data lives. We add the orchestration, evaluation, and monitoring around it.',
  },
  {
    q: 'Who owns the code?',
    a: 'You do, from the first commit. Every engagement ends with a repository your team can run without us.',
  },
];

export default function AutonoDemo() {
  return (
    <main className="min-h-screen bg-background text-foreground antialiased">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="font-heading text-xl font-semibold tracking-tight">Autono</span>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
          <a href="#services" className="hover:text-foreground">
            Services
          </a>
          <a href="#work" className="hover:text-foreground">
            Work
          </a>
          <a href="#faq" className="hover:text-foreground">
            FAQ
          </a>
        </nav>
        <Button variant="outline">Book a call</Button>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Agentic solutions
        </p>
        <h1 className="mt-4 max-w-3xl font-heading text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          Agents that ship real work, inside the tools you already run.
        </h1>
        <p className="mt-6 max-w-[62ch] text-lg leading-relaxed text-muted-foreground">
          Autono designs and builds agents, automations, and products for teams that want the upside
          of AI without a research project. Scoped pilots, measurable outcomes, code you own.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg">Start a project</Button>
          <Button size="lg" variant="outline">
            See the work
          </Button>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Typical pilot: <span className="font-mono text-[0.9em]">2–6 weeks</span> · one outcome ·
          one owner
        </p>
      </section>

      <section id="services" className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            What we build
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {services.map((s) => (
              <Card key={s.title}>
                <CardHeader>
                  <CardTitle className="font-heading text-xl">{s.title}</CardTitle>
                  <CardDescription>{s.body}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" size="sm" className="-ml-2">
                    Learn more
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="work" className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Current engagements
            </h2>
            <Badge variant="outline">Updated weekly</Badge>
          </div>
          <Tabs defaultValue="all" className="mt-8">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="live">Live</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <EngagementTable rows={engagements} />
            </TabsContent>
            <TabsContent value="live">
              <EngagementTable rows={engagements.filter((e) => e.status === 'Live')} />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <section id="faq" className="border-t border-border">
        <div className="mx-auto grid max-w-5xl gap-10 px-6 py-20 md:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Questions
            </h2>
            <p className="mt-3 text-muted-foreground">
              The ones every founder asks on the first call.
            </p>
          </div>
          <Accordion type="single" collapsible>
            {faqs.map((f, i) => (
              <AccordionItem key={f.q} value={`faq-${i}`}>
                <AccordionTrigger>{f.q}</AccordionTrigger>
                <AccordionContent>{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <div className="dark bg-background text-foreground">
        <section className="mx-auto max-w-5xl px-6 py-20">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Start here
              </p>
              <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                Tell us the job. We will scope the agent.
              </h2>
              <p className="mt-4 max-w-[52ch] text-muted-foreground">
                One paragraph about the work you want done. You get a scoped pilot proposal back
                within two business days.
              </p>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-xl">Request a pilot</CardTitle>
                <CardDescription>No deck required.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Field>
                  <FieldLabel htmlFor="autono-email">Work email</FieldLabel>
                  <Input id="autono-email" type="email" placeholder="you@company.com" />
                  <FieldDescription>We reply from bobak@autono.co.</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="autono-job">The job</FieldLabel>
                  <Input id="autono-job" placeholder="Triage inbound support in Intercom" />
                </Field>
                <Button size="lg">Send</Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground">
          <span className="font-heading text-base font-semibold text-foreground">Autono</span>
          <span className="font-mono text-[0.9em]">Miami · bobak@autono.co</span>
        </div>
      </footer>
    </main>
  );
}

function EngagementTable({ rows }: { rows: typeof engagements }) {
  return (
    <div className="mt-4 rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Scope</TableHead>
            <TableHead>Agent</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((e) => (
            <TableRow key={e.client}>
              <TableCell className="font-medium">{e.client}</TableCell>
              <TableCell className="text-muted-foreground">{e.scope}</TableCell>
              <TableCell className="font-mono text-[0.9em]">{e.owner}</TableCell>
              <TableCell className="text-right">
                <Badge variant={e.status === 'Live' ? 'default' : 'secondary'}>{e.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
