import { Loader2, MessageSquarePlus, X } from 'lucide-react';
import { Button } from '~/components/ui/button';

export type Selection = { loc: string; tag: string; text: string };

/**
 * The floating note box that follows an inspector pick: shows the picked
 * element and lets the user leave a comment for their agent.
 */
export function SelectionNote({
  selection,
  note,
  saving,
  onNoteChange,
  onSubmit,
  onClear,
}: {
  selection: Selection;
  note: string;
  saving: boolean;
  onNoteChange: (note: string) => void;
  onSubmit: () => void;
  onClear: () => void;
}) {
  return (
    <div className="fixed bottom-6 right-6 z-20 w-[340px] rounded-lg border bg-background p-3 shadow-xl">
      <div className="flex items-center gap-2">
        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
          {selection.tag}
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">
          line {selection.loc.replace(':', ', col ')}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto size-6"
          aria-label="Clear selection"
          onClick={onClear}
        >
          <X className="size-3.5" />
        </Button>
      </div>
      {selection.text && (
        <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">“{selection.text}”</p>
      )}
      <textarea
        value={note}
        onChange={(e) => onNoteChange(e.target.value)}
        placeholder="Leave a note for your agent — e.g. “make this bold”"
        rows={2}
        className="mt-2 w-full resize-none rounded-md border bg-transparent px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
      />
      <div className="mt-2 flex justify-end gap-2">
        <Button
          size="sm"
          onClick={onSubmit}
          disabled={!note.trim() || saving}
          aria-label="Save comment"
        >
          {saving ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <MessageSquarePlus className="size-3.5" />
          )}
          Comment
        </Button>
      </div>
    </div>
  );
}
