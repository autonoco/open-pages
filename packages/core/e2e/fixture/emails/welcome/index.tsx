import type { EmailMeta } from '@autono/open-pages';
import { Body, Button, Container, Head, Heading, Html, Preview, Tailwind, Text } from 'react-email';

export const meta: EmailMeta = {
  title: 'Welcome Email',
  subject: 'Welcome to the fixture',
  createdAt: '2026-01-02T00:00:00.000Z',
};

export default function Welcome() {
  return (
    <Html lang="en">
      <Head />
      <Preview>Fixture preheader</Preview>
      <Tailwind>
        <Body className="bg-[#f4f4f2] font-sans">
          <Container className="mx-auto max-w-[600px] bg-white p-8">
            <Heading className="text-[24px] text-[#111111]">Welcome headline</Heading>
            <Text className="text-[16px] text-[#444444]">Fixture email body copy.</Text>
            <Button href="https://example.com/start" className="bg-[#111111] px-5 py-3 text-white">
              Get started
            </Button>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
