import type { PageMeta } from '@autono/open-pages';
import { Bot, Hash, Pin, Search, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from '@/ui/avatar';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import { Kbd } from '@/ui/kbd';
import { Separator } from '@/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/ui/sidebar';
import { Composer } from './components/composer';
import {
  type AgentId,
  agents,
  channels,
  type Message,
  members,
  mentionedAgent,
  personFor,
  scriptedReply,
  seedMessages,
  you,
} from './components/data';
import { Thread } from './components/thread';

export const meta: PageMeta = {
  title: 'Relay — Team & agent chat',
  description:
    'A team chat where research, writing, and ops agents work in the same threads as people.',
  createdAt: '2026-09-27T17:40:34.356Z',
};

const REPLY_DELAY_MS = 1400;

function nowLabel(): string {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(
    new Date(),
  );
}

export default function TeamChat() {
  const [channelId, setChannelId] = useState('launch-week');
  const [messages, setMessages] = useState<Message[]>(seedMessages);
  const [thinking, setThinking] = useState<AgentId | null>(null);
  const [readIds, setReadIds] = useState<string[]>(['launch-week']);
  const timers = useRef<number[]>([]);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  const channel = channels.find((c) => c.id === channelId) ?? channels[0];
  const thread = useMemo(
    () => messages.filter((m) => m.channelId === channel.id),
    [messages, channel.id],
  );
  const agentRuns = useMemo(() => thread.filter((m) => m.run), [thread]);
  const me = personFor(you);

  useEffect(() => {
    return () => {
      for (const t of timers.current) window.clearTimeout(t);
    };
  }, []);

  function select(id: string) {
    setChannelId(id);
    setReadIds((r) => (r.includes(id) ? r : [...r, id]));
  }

  function send(text: string) {
    const id = `m${Date.now()}`;
    setMessages((m) => [
      ...m,
      { id, channelId: channel.id, authorId: you, time: nowLabel(), text },
    ]);
    const agent = mentionedAgent(text, channel);
    if (!agent) return;
    setThinking(agent);
    const t = window.setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id: `${id}-reply`,
          channelId: channel.id,
          time: nowLabel(),
          ...scriptedReply(agent, text),
        },
      ]);
      setThinking(null);
    }, REPLY_DELAY_MS);
    timers.current.push(t);
  }

  function askAgent() {
    composerRef.current?.focus();
  }

  return (
    <main className="min-h-screen bg-background text-foreground antialiased">
      <SidebarProvider className="h-screen min-h-0">
        <Sidebar collapsible="offcanvas">
          <SidebarHeader className="px-3 py-3">
            <div className="flex items-center gap-2 px-1">
              <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Sparkles className="size-4" aria-hidden />
              </span>
              <span className="text-sm font-semibold tracking-tight">Relay</span>
              <Badge variant="secondary" className="ml-auto text-[10px]">
                Beta
              </Badge>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Channels</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {channels
                    .filter((c) => c.kind === 'channel')
                    .map((c) => (
                      <SidebarMenuItem key={c.id}>
                        <SidebarMenuButton
                          isActive={c.id === channel.id}
                          onClick={() => select(c.id)}
                        >
                          <Hash aria-hidden />
                          <span>{c.name}</span>
                        </SidebarMenuButton>
                        {c.unread && !readIds.includes(c.id) ? (
                          <SidebarMenuBadge>{c.unread}</SidebarMenuBadge>
                        ) : null}
                      </SidebarMenuItem>
                    ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Agents</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {channels
                    .filter((c) => c.kind === 'agent')
                    .map((c) => (
                      <SidebarMenuItem key={c.id}>
                        <SidebarMenuButton
                          isActive={c.id === channel.id}
                          onClick={() => select(c.id)}
                        >
                          <Bot aria-hidden />
                          <span>{c.name}</span>
                          <span className="ml-auto size-1.5 rounded-full bg-primary" aria-hidden />
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Team</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {members.map((m) => (
                    <SidebarMenuItem key={m.id}>
                      <SidebarMenuButton disabled={m.id === you}>
                        <Avatar size="sm" className="size-5">
                          <AvatarFallback className="text-[9px]">{m.initials}</AvatarFallback>
                        </Avatar>
                        <span>{m.name}</span>
                        <span className="ml-auto text-xs text-muted-foreground">{m.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="px-3 py-3">
            <div className="flex items-center gap-2 px-1 text-sm">
              <Avatar size="sm">
                <AvatarFallback>{me.initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 leading-tight">
                <div className="truncate font-medium">{me.name}</div>
                <div className="truncate text-xs text-muted-foreground">{me.title}</div>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex min-h-0 flex-col">
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4 sm:px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-5" />
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {channel.kind === 'agent' ? (
                <Bot className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              ) : (
                <Hash className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              )}
              <h1 className="truncate text-sm font-semibold">{channel.name}</h1>
              <span className="hidden truncate text-sm text-muted-foreground md:inline">
                · {channel.topic}
              </span>
            </div>
            <AvatarGroup className="hidden sm:flex">
              {members.slice(0, 3).map((m) => (
                <Avatar key={m.id} size="sm">
                  <AvatarFallback>{m.initials}</AvatarFallback>
                </Avatar>
              ))}
              <AvatarGroupCount>+{members.length - 3 + agents.length}</AvatarGroupCount>
            </AvatarGroup>
            <Button
              variant="outline"
              size="sm"
              className="hidden md:inline-flex"
              aria-label="Search messages"
            >
              <Search aria-hidden />
              Search
              <Kbd className="ml-1">⌘K</Kbd>
            </Button>
            <Button size="sm" onClick={askAgent}>
              <Sparkles aria-hidden />
              Ask an Agent
            </Button>
          </header>

          <div className="flex min-h-0 flex-1">
            <section
              className="flex min-h-0 min-w-0 flex-1 flex-col"
              aria-label={`${channel.name} conversation`}
            >
              <Thread channel={channel} messages={thread} thinking={thinking} />
              <Composer channel={channel} onSend={send} textareaRef={composerRef} />
            </section>

            <aside className="hidden w-72 shrink-0 flex-col gap-6 overflow-y-auto border-l border-border px-5 py-6 xl:flex">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Agents on call
                </h2>
                <ul className="mt-3 flex flex-col gap-3">
                  {agents.map((a) => (
                    <li key={a.id} className="flex items-start gap-2.5">
                      <Avatar size="sm">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {a.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 leading-tight">
                        <div className="text-sm font-medium">{a.name}</div>
                        <div className="text-xs text-muted-foreground">{a.skill}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <Separator />
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Agent runs in this thread
                </h2>
                {agentRuns.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    None yet. Mention an agent to start one.
                  </p>
                ) : (
                  <ol className="mt-3 flex flex-col gap-3">
                    {agentRuns.map((m) => (
                      <li
                        key={m.id}
                        className="rounded-lg border border-border bg-card p-3 text-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{personFor(m.authorId).name}</span>
                          <time className="text-xs tabular-nums text-muted-foreground">
                            {m.time}
                          </time>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {m.run?.steps.length} steps · {m.run?.sources?.length ?? 0} sources
                        </p>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
              <Separator />
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Pinned
                </h2>
                <ul className="mt-3 flex flex-col gap-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Pin className="size-3.5 text-muted-foreground" aria-hidden />
                    <a href="#launch-checklist" className="underline-offset-4 hover:underline">
                      Launch checklist
                    </a>
                  </li>
                  <li className="flex items-center gap-2">
                    <Pin className="size-3.5 text-muted-foreground" aria-hidden />
                    <a href="#email-v3" className="underline-offset-4 hover:underline">
                      Launch email v3
                    </a>
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </main>
  );
}
