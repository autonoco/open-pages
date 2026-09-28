import type { EmailMeta } from '@autono/open-pages';
import {
  Body,
  Button,
  Container,
  Font,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from 'react-email';
import { createEmailTailwindConfig } from '@/components/email/email-theme';
import { autonoTheme } from '@/components/email/theme-autono';

export const meta: EmailMeta = {
  title: 'Welcome',
  subject: 'Welcome to Relay',
  description: 'Onboarding email sent after signup, on the Autono theme.',
  createdAt: '2026-09-27T20:00:00.000Z',
};

export default function Welcome() {
  return (
    <Html lang="en">
      <Head>
        <Font
          fontFamily="Source Serif 4"
          fallbackFontFamily="Georgia"
          webFont={{
            url: 'https://fonts.gstatic.com/s/sourceserif4/v13/vEFy2_tTDB4M7-auWDN0ahZJW3IX2ih5nk3AucvUHf6OAVIJmeUDygwjihdqrhxXD-wGvjU.woff2',
            format: 'woff2',
          }}
          fontWeight={600}
          fontStyle="normal"
        />
      </Head>
      <Preview>Your workspace is ready. Here is how to get started.</Preview>
      <Tailwind config={createEmailTailwindConfig(autonoTheme)}>
        <Body className="bg-bg font-sans">
          <Container className="mx-auto my-8 max-w-email rounded-lg border border-solid border-stroke bg-white px-8 py-10">
            <Text className="m-0 font-11 font-medium uppercase tracking-[0.2em] text-brand">
              Agentic solutions
            </Text>
            <Heading
              className="mt-3 mb-0 font-28 text-fg"
              style={{ fontFamily: '"Source Serif 4", Georgia, serif' }}
            >
              Welcome to Relay
            </Heading>
            <Text className="font-16 text-fg-2">
              Your workspace is ready. Invite your team, then mention an agent in any thread to put
              it to work.
            </Text>
            <Section className="my-6">
              <Button
                href="https://example.com/app"
                className="rounded bg-brand px-6 py-3 font-14 font-medium text-brand-fg"
              >
                Open Relay
              </Button>
            </Section>
            <Hr className="my-6 border-stroke" />
            <Text className="m-0 font-13 text-fg-3">
              You are receiving this because you signed up. Miami ·{' '}
              <span className="font-mono">bobak@autono.co</span>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
