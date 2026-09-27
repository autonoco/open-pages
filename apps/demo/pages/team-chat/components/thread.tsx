import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/ui/avatar';
import { Badge } from '@/ui/badge';
import { Bubble, BubbleContent } from '@/ui/bubble';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/ui/empty';
import { Message, MessageAvatar, MessageContent, MessageHeader } from '@/ui/message';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@/ui/message-scroller';
import { Spinner } from '@/ui/spinner';
import { type AgentId, type Channel, isAgent, type Message as Msg, personFor, you } from './data';

export function Thread({
  channel,
  messages,
  thinking,
}: {
  channel: Channel;
  messages: Msg[];
  thinking: AgentId | null;
}) {
  if (messages.length === 0 && !thinking) {
    return (
      <Empty className="flex-1">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Sparkles aria-hidden />
          </EmptyMedia>
          <EmptyTitle>Nothing in #{channel.name} yet</EmptyTitle>
          <EmptyDescription>
            Start the thread, or mention an agent with @Atlas, @Quill, or @Ledger to put one to
            work.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <MessageScrollerProvider autoScroll>
      <MessageScroller className="flex-1">
        <MessageScrollerViewport className="px-4 py-6 sm:px-6">
          <MessageScrollerContent className="mx-auto w-full max-w-3xl gap-5">
            {messages.map((m) => (
              <MessageScrollerItem key={m.id} messageId={m.id}>
                <ChatMessage message={m} />
              </MessageScrollerItem>
            ))}
            {thinking ? (
              <MessageScrollerItem messageId="thinking">
                <ThinkingRow agent={thinking} />
              </MessageScrollerItem>
            ) : null}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
      </MessageScroller>
    </MessageScrollerProvider>
  );
}

function ChatMessage({ message }: { message: Msg }) {
  const author = personFor(message.authorId);
  const mine = message.authorId === you;
  const agent = isAgent(message.authorId);

  return (
    <Message align={mine ? 'end' : 'start'}>
      <MessageAvatar>
        <Avatar size="sm">
          <AvatarFallback className={cn(agent && 'bg-primary text-primary-foreground')}>
            {author.initials}
          </AvatarFallback>
        </Avatar>
      </MessageAvatar>
      <MessageContent>
        <MessageHeader className="gap-2">
          <span className="text-foreground">{mine ? 'You' : author.name}</span>
          {agent ? (
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
              Agent
            </Badge>
          ) : null}
          <time className="tabular-nums">{message.time}</time>
        </MessageHeader>
        {message.run ? <RunCard run={message.run} /> : null}
        <Bubble
          variant={mine ? 'default' : agent ? 'tinted' : 'outline'}
          align={mine ? 'end' : 'start'}
        >
          <BubbleContent className="whitespace-pre-line">{message.text}</BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  );
}

function RunCard({ run }: { run: NonNullable<Msg['run']> }) {
  return (
    <div className="w-fit max-w-[80%] rounded-lg border border-border bg-card px-3 py-2 text-xs text-card-foreground">
      <ol className="flex flex-col gap-1">
        {run.steps.map((step) => (
          <li key={step.label} className="flex items-center gap-2">
            <Check className="size-3 text-primary" aria-hidden />
            <span className="text-muted-foreground">{step.label}</span>
          </li>
        ))}
      </ol>
      {run.sources ? (
        <div className="mt-2 flex flex-wrap gap-1 border-t border-border pt-2">
          {run.sources.map((s) => (
            <Badge key={s} variant="outline" className="h-5 px-1.5 text-[10px] font-normal">
              {s}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ThinkingRow({ agent }: { agent: AgentId }) {
  const author = personFor(agent);
  return (
    <Message aria-live="polite">
      <MessageAvatar>
        <Avatar size="sm">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {author.initials}
          </AvatarFallback>
        </Avatar>
      </MessageAvatar>
      <MessageContent>
        <MessageHeader className="gap-2">
          <span className="text-foreground">{author.name}</span>
          <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
            Agent
          </Badge>
        </MessageHeader>
        <Bubble variant="tinted">
          <BubbleContent className="flex items-center gap-2">
            <Spinner className="size-3.5" />
            {author.name} is working…
          </BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  );
}
