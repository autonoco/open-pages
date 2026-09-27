import type { EmailMeta } from '@autono/open-pages';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from 'react-email';

export const meta: EmailMeta = {
  title: 'Welcome',
  subject: 'Welcome to open-pages',
  description: 'The starter email. Ask your agent to /create-email for a real one.',
  createdAt: '2026-09-27T00:00:00.000Z',
};

export default function Welcome() {
  return (
    <Html lang="en">
      <Head />
      <Preview>Emails live next to your pages now. Here is how they work.</Preview>
      <Tailwind>
        <Body className="bg-[#f4f4f2] font-sans">
          <Container className="mx-auto my-8 max-w-[600px] rounded-lg bg-white px-8 py-10">
            <Heading className="m-0 text-[24px] font-semibold leading-tight text-[#111111]">
              Emails, the same way as pages
            </Heading>
            <Text className="text-[16px] leading-6 text-[#444444]">
              This file is <code>emails/welcome/index.tsx</code>: one react-email component. The
              workspace renders it on the server, shows the HTML and the plain-text version, and
              exports both with <code>open-pages export</code>.
            </Text>
            <Text className="text-[16px] leading-6 text-[#444444]">
              Ask your agent to run <code>/create-email</code>. It installs sections, themes, and
              whole emails from the emailcn registry with the shadcn CLI, then writes the email
              here.
            </Text>
            <Section className="my-6">
              <Button
                href="https://docs.openpages.sh/authoring/emails"
                className="rounded-md bg-[#111111] px-5 py-3 text-[14px] font-medium text-white"
              >
                Read the email docs
              </Button>
            </Section>
            <Hr className="my-6 border-[#e5e5e5]" />
            <Text className="m-0 text-[13px] leading-5 text-[#888888]">
              You are seeing this because it ships with every new open-pages workspace.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
