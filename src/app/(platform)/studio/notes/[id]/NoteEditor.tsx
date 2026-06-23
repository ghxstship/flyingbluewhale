"use client";

import { useActionState, useState } from "react";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { Button } from "@/components/ui/Button";
import { saveNoteAction, type State } from "../actions";

export type NoteEditorProps = {
  id: string;
  title: string;
  bodyHtml: string;
  noteState: string;
  labels: {
    titleLabel: string;
    titlePlaceholder: string;
    stateLabel: string;
    stateDraft: string;
    statePublished: string;
    stateArchived: string;
    save: string;
    saving: string;
    saved: string;
    error: string;
  };
};

export function NoteEditor({ id, title, bodyHtml, noteState, labels }: NoteEditorProps) {
  const [html, setHtml] = useState(bodyHtml);
  const [state, formAction, pending] = useActionState<State, FormData>(saveNoteAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="body_html" value={html} />

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex-1">
          <span className="mb-1 block text-xs font-medium text-[var(--p-text-2)]">{labels.titleLabel}</span>
          <input
            name="title"
            defaultValue={title}
            placeholder={labels.titlePlaceholder}
            className="w-full rounded-md border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm"
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium text-[var(--p-text-2)]">{labels.stateLabel}</span>
          <select
            name="note_state"
            defaultValue={noteState}
            className="rounded-md border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm"
          >
            <option value="draft">{labels.stateDraft}</option>
            <option value="published">{labels.statePublished}</option>
            <option value="archived">{labels.stateArchived}</option>
          </select>
        </label>
      </div>

      <RichTextEditor defaultValue={bodyHtml} onChange={setHtml} minHeight={320} />

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? labels.saving : labels.save}
        </Button>
        {state?.ok && <span className="text-sm text-[var(--p-success-text)]">{labels.saved}</span>}
        {state?.error && <span className="text-sm text-[var(--p-danger-text)]">{labels.error}</span>}
      </div>
    </form>
  );
}
