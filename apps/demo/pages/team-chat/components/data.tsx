export type MemberId = 'maya' | 'dev' | 'sofia' | 'jonah';
export type AgentId = 'atlas' | 'quill' | 'ledger';
export type AuthorId = MemberId | AgentId;

export type Person = { id: AuthorId; name: string; initials: string; title: string };

export const members: Person[] = [
  { id: 'maya', name: 'Maya Chen', initials: 'MC', title: 'Founder' },
  { id: 'dev', name: 'Dev Patel', initials: 'DP', title: 'Growth' },
  { id: 'sofia', name: 'Sofia Reyes', initials: 'SR', title: 'Marketing' },
  { id: 'jonah', name: 'Jonah Kim', initials: 'JK', title: 'Engineering' },
];

export const agents: (Person & { id: AgentId; skill: string })[] = [
  {
    id: 'atlas',
    name: 'Atlas',
    initials: 'A',
    title: 'Research agent',
    skill: 'Pulls numbers and sources',
  },
  {
    id: 'quill',
    name: 'Quill',
    initials: 'Q',
    title: 'Writing agent',
    skill: 'Drafts and tightens copy',
  },
  {
    id: 'ledger',
    name: 'Ledger',
    initials: 'L',
    title: 'Ops agent',
    skill: 'Invoices, renewals, vendors',
  },
];

export const you: MemberId = 'maya';

export type Channel = {
  id: string;
  kind: 'channel' | 'agent';
  name: string;
  topic: string;
  unread?: number;
};

export const channels: Channel[] = [
  { id: 'general', kind: 'channel', name: 'general', topic: 'Company-wide announcements' },
  {
    id: 'launch-week',
    kind: 'channel',
    name: 'launch-week',
    topic: 'Everything for the Oct 6 launch',
    unread: 3,
  },
  {
    id: 'design-crit',
    kind: 'channel',
    name: 'design-crit',
    topic: 'Drop work in progress for feedback',
  },
  {
    id: 'dm-atlas',
    kind: 'agent',
    name: 'Atlas',
    topic: 'Research agent · replies in this thread',
  },
  { id: 'dm-quill', kind: 'agent', name: 'Quill', topic: 'Writing agent · replies in this thread' },
];

export type RunStep = { label: string; done: boolean };

export type Message = {
  id: string;
  channelId: string;
  authorId: AuthorId;
  time: string;
  text: string;
  run?: { steps: RunStep[]; sources?: string[] };
};

export const seedMessages: Message[] = [
  {
    id: 'm1',
    channelId: 'general',
    authorId: 'jonah',
    time: '9:02 AM',
    text: 'Deploy pipeline is back to green. The flaky e2e was a timezone assumption in the fixture.',
  },
  {
    id: 'm2',
    channelId: 'general',
    authorId: 'maya',
    time: '9:05 AM',
    text: 'Thank you. Reminder that launch week planning lives in #launch-week from today.',
  },
  {
    id: 'm3',
    channelId: 'launch-week',
    authorId: 'sofia',
    time: '10:14 AM',
    text: 'Launch email draft is in Notion. Can someone sanity-check the numbers in the second paragraph before I send it to the list?',
  },
  {
    id: 'm4',
    channelId: 'launch-week',
    authorId: 'dev',
    time: '10:16 AM',
    text: '@Atlas pull last week’s signups and activation rate from Mixpanel and compare to the week before.',
  },
  {
    id: 'm5',
    channelId: 'launch-week',
    authorId: 'atlas',
    time: '10:16 AM',
    text: 'Week of Sep 15–21 versus the week before:\n• Signups: 1,284 (+18%)\n• Activation (first project created): 41% (+3 pts)\n• Median time to first project: 6 min (−2 min)\n\nThe email says “over 1,500 signups”. That is the month-to-date figure, not last week. Suggest “1,284 new teams last week”.',
    run: {
      steps: [
        { label: 'Queried Mixpanel · 2 events, 2 ranges', done: true },
        { label: 'Compared with the prior week', done: true },
        { label: 'Checked the Notion draft for number claims', done: true },
      ],
      sources: ['Mixpanel · Signups', 'Mixpanel · Activation', 'Notion · Launch email v3'],
    },
  },
  {
    id: 'm6',
    channelId: 'launch-week',
    authorId: 'maya',
    time: '10:21 AM',
    text: 'Good catch. Quill, turn that into two sentences for the email. Keep the tone plain.',
  },
  {
    id: 'm7',
    channelId: 'launch-week',
    authorId: 'quill',
    time: '10:21 AM',
    text: '“Last week 1,284 new teams signed up, and 41% created their first project within the hour. We built this launch around what they told us.”',
    run: {
      steps: [
        { label: 'Read Atlas’s summary and the draft', done: true },
        { label: 'Drafted 3 variants, picked the plainest', done: true },
      ],
    },
  },
  {
    id: 'm8',
    channelId: 'dm-atlas',
    authorId: 'maya',
    time: 'Yesterday',
    text: 'Which competitors announced pricing changes this quarter?',
  },
  {
    id: 'm9',
    channelId: 'dm-atlas',
    authorId: 'atlas',
    time: 'Yesterday',
    text: 'Three: Linear raised the Business tier, Notion added an AI add-on, and Height moved to usage-based seats. Full notes with dates and links are pinned.',
    run: {
      steps: [
        { label: 'Searched 12 sources', done: true },
        { label: 'Filtered to pricing pages and changelogs', done: true },
      ],
      sources: ['linear.app/pricing', 'notion.so/pricing', 'height.app/changelog'],
    },
  },
];

export function personFor(id: AuthorId): Person {
  return members.find((m) => m.id === id) ?? agents.find((a) => a.id === id) ?? members[0];
}

export function isAgent(id: AuthorId): id is AgentId {
  return agents.some((a) => a.id === id);
}

// A mention is an @token at the start of the text or after whitespace, so an
// email address or a partial id never summons an agent.
export function mentionedAgent(text: string, channel: Channel): AgentId | null {
  for (const match of text.matchAll(/(?:^|\s)@(\w+)/g)) {
    const token = match[1].toLowerCase();
    const agent = agents.find((a) => a.id === token);
    if (agent) return agent.id;
  }
  if (channel.kind === 'agent') return channel.id.replace('dm-', '') as AgentId;
  return null;
}

export function scriptedReply(
  agent: AgentId,
  ask: string,
): Omit<Message, 'id' | 'channelId' | 'time'> {
  const topic = ask.replace(/@\w+/g, '').trim() || 'that';
  const quoted = topic.length > 72 ? `${topic.slice(0, 72)}…` : topic;
  switch (agent) {
    case 'atlas':
      return {
        authorId: 'atlas',
        text: `Here is what I found on “${quoted}”. Two sources agree, one is a week stale, so I weighted the fresh ones. Full notes are pinned in this thread.`,
        run: {
          steps: [
            { label: 'Searched 9 sources', done: true },
            { label: 'Cross-checked the two that disagreed', done: true },
            { label: 'Wrote the summary', done: true },
          ],
          sources: ['Mixpanel', 'Notion', 'Web · 3 pages'],
        },
      };
    case 'quill':
      return {
        authorId: 'quill',
        text: `Draft for “${quoted}”:\n\n“Short, specific, and in your voice. One claim per sentence, numbers where you have them, no adjectives doing the work.”\n\nWant it warmer or tighter?`,
        run: {
          steps: [
            { label: 'Read the thread for context', done: true },
            { label: 'Drafted 3 variants, picked one', done: true },
          ],
        },
      };
    case 'ledger':
      return {
        authorId: 'ledger',
        text: `Checked “${quoted}” against Stripe and the vendor sheet. Nothing is overdue; two renewals land next week and I have drafted the reminders for your approval.`,
        run: {
          steps: [
            { label: 'Read Stripe · 14 invoices', done: true },
            { label: 'Matched against the vendor sheet', done: true },
          ],
          sources: ['Stripe', 'Vendors (Sheets)'],
        },
      };
  }
}
