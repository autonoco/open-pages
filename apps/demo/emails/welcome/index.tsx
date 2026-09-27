import type { EmailMeta } from '@autono/open-pages';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from 'react-email';

export const meta: EmailMeta = {
  title: 'Welcome',
  subject: 'Welcome to Relay',
  description: 'Onboarding email sent after signup.',
  createdAt: '2026-09-27T20:00:00.000Z',
};

export default function Welcome() {
  return (
    <Html lang="en">
      <Head />
      <Preview>Your workspace is ready. Here is how to get started.</Preview>
      <Tailwind>
        <Body className="bg-[#f6f6f4] font-sans">
          <Container className="mx-auto my-8 max-w-[600px] rounded-lg bg-white p-8">
            <Heading className="m-0 text-[24px] font-semibold text-[#111]">
              Welcome to Relay
            </Heading>
            <Text className="text-[15px] leading-6 text-[#444]">
              Your workspace is ready. Invite your team, then mention an agent in any thread to put
              it to work.
            </Text>
            <Section className="my-6">
              <Button
                href="https://example.com/app"
                className="rounded-md bg-[#111] px-5 py-3 text-[14px] font-medium text-white"
              >
                Open Relay
              </Button>
            </Section>
            <Text className="text-[13px] text-[#888]">
              You are receiving this because you signed up.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
