import type { PageMeta } from '@autono/open-pages';
import { useState } from 'react';
import { Button } from '@/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { Switch } from '@/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs';

export const meta: PageMeta = {
  title: 'Shadcn Page',
  description: 'Fixture page composed from the baked-in shadcn set.',
  theme: 'plain',
  createdAt: '2026-01-04T00:00:00.000Z',
};

export default function Shadcn() {
  const [digest, setDigest] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <h1 className="sr-only">Shadcn headline</h1>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Fixture form built from ui/.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="email">
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="email" className="flex-1">
                Email
              </TabsTrigger>
              <TabsTrigger value="sso" className="flex-1">
                SSO
              </TabsTrigger>
            </TabsList>
            <TabsContent value="email">
              <form
                className="flex flex-col gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitted(true);
                }}
              >
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">Work email</Label>
                  <Input id="email" type="email" placeholder="ada@company.com" />
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <Label htmlFor="digest">Weekly digest</Label>
                  <Switch id="digest" checked={digest} onCheckedChange={setDigest} />
                </div>
                <Button type="submit" className="w-full">
                  {submitted ? 'Check your inbox' : 'Create account'}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="sso">
              <Button variant="outline" className="w-full">
                Continue with SSO
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}
