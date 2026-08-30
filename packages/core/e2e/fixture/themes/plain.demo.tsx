import { Button } from '@/ui/button';

export default function PlainDemo() {
  return (
    <main className="min-h-screen bg-background px-8 py-16 text-foreground">
      <h1 className="text-4xl font-bold">Theme demo</h1>
      <p className="mt-4">Minimal fixture theme demo.</p>
      <Button className="mt-6">Themed button</Button>
    </main>
  );
}
