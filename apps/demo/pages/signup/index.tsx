import type { PageMeta } from '@autono/open-pages';
import { useState } from 'react';
import { Button } from '@/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/ui/card';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { Switch } from '@/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs';

export const meta: PageMeta = {
  title: 'Create your account',
  description: 'Sign up for Meridian.',
  theme: 'ember',
  createdAt: '2026-08-29T00:00:00.000Z',
};

export default function Signup() {
  const [digest, setDigest] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Start with a free workspace. No card required.</CardDescription>
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
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" placeholder="Ada Lovelace" required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">Work email</Label>
                  <Input id="email" type="email" placeholder="ada@company.com" required />
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex flex-col gap-0.5">
                    <Label htmlFor="digest">Weekly digest</Label>
                    <span className="text-xs text-muted-foreground">One email, every Monday.</span>
                  </div>
                  <Switch id="digest" checked={digest} onCheckedChange={setDigest} />
                </div>
                <Button type="submit" className="w-full">
                  {submitted ? 'Check your inbox' : 'Create account'}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="sso">
              <div className="flex flex-col gap-3">
                <Button variant="outline" className="w-full">
                  Continue with Google
                </Button>
                <Button variant="outline" className="w-full">
                  Continue with Okta
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          Already have an account?&nbsp;
          <a href="#login" className="underline underline-offset-4 hover:text-foreground">
            Sign in
          </a>
        </CardFooter>
      </Card>
    </main>
  );
}
