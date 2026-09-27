import type { EmailMeta } from '@autono/open-pages';
import { NotificationDefault } from '@/components/email/notification-default';

export const meta: EmailMeta = {
  title: 'Agent run finished',
  subject: 'Atlas finished a run in #launch-week',
  description: 'Sent when an agent completes a run someone asked for.',
  createdAt: '2026-09-27T20:10:00.000Z',
};

export default function AgentRunFinished() {
  return (
    <NotificationDefault
      actorName="Atlas"
      _action="finished a run in"
      _targetName="#launch-week"
      ctaLabel="Open the thread"
      ctaHref="https://example.com/app/launch-week"
    />
  );
}
