import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { Input } from '@/ui/input';

export default function EmberDemo() {
  return (
    <main className="min-h-screen bg-background p-10 text-foreground">
      <Badge variant="secondary">Ember</Badge>
      <h1 className="mt-4 text-5xl font-semibold tracking-tight">Warm, editorial, direct.</h1>
      <p className="mt-4 max-w-lg text-lg text-muted-foreground">
        One accent, hairline rules, tight corners. Every shadcn component picks these tokens up.
      </p>
      <div className="mt-8 flex gap-3">
        <Button>Get started</Button>
        <Button variant="outline">Read the docs</Button>
      </div>
      <Card className="mt-10 max-w-md">
        <CardHeader>
          <CardTitle>Stay in the loop</CardTitle>
          <CardDescription>One email a week. Unsubscribe any time.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input placeholder="you@company.com" />
          <Button>Subscribe</Button>
        </CardContent>
      </Card>
    </main>
  );
}
