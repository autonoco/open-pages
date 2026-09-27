import { AtSign, Paperclip, SendHorizontal } from 'lucide-react';
import { type FormEvent, type RefObject, useState } from 'react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@/ui/input-group';
import { Kbd } from '@/ui/kbd';
import { agents, type Channel } from './data';

export function Composer({
  channel,
  onSend,
  textareaRef,
}: {
  channel: Channel;
  onSend: (text: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}) {
  const [text, setText] = useState('');
  const canSend = text.trim().length > 0;

  function submit(e?: FormEvent) {
    e?.preventDefault();
    if (!canSend) return;
    onSend(text.trim());
    setText('');
  }

  function mention() {
    const agent = channel.kind === 'agent' ? channel.name : agents[0].name;
    setText((t) => (t.endsWith(' ') || t === '' ? `${t}@${agent} ` : `${t} @${agent} `));
    textareaRef.current?.focus();
  }

  const placeholder =
    channel.kind === 'agent'
      ? `Ask ${channel.name}…`
      : `Message #${channel.name}, or @Atlas to ask the agent…`;

  return (
    <form onSubmit={submit} className="border-t border-border bg-background px-4 py-3 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <InputGroup>
          <InputGroupTextarea
            ref={textareaRef}
            name="message"
            aria-label={`Message ${channel.kind === 'agent' ? channel.name : `#${channel.name}`}`}
            placeholder={placeholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            autoComplete="off"
            spellCheck
            className="min-h-10"
          />
          <InputGroupAddon align="block-end" className="justify-between">
            <div className="flex items-center gap-1">
              <InputGroupButton type="button" aria-label="Attach a file">
                <Paperclip aria-hidden />
              </InputGroupButton>
              <InputGroupButton type="button" aria-label="Mention an agent" onClick={mention}>
                <AtSign aria-hidden />
              </InputGroupButton>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-muted-foreground sm:inline">
                <Kbd>Enter</Kbd> to send · <Kbd>Shift</Kbd>+<Kbd>Enter</Kbd> for a new line
              </span>
              <InputGroupButton
                type="submit"
                variant="default"
                size="icon-sm"
                disabled={!canSend}
                aria-label="Send message"
              >
                <SendHorizontal aria-hidden />
              </InputGroupButton>
            </div>
          </InputGroupAddon>
        </InputGroup>
      </div>
    </form>
  );
}
