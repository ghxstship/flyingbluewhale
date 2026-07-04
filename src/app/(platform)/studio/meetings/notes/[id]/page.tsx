import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { RecordActionButton } from "@/components/ui/RecordActionButton";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase, env } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { parseActionItems, type NoteState } from "@/lib/meeting-notes";
import { summarizeNote, createTasksFromActionItems, archiveNote, deleteNote } from "../actions";

export const dynamic = "force-dynamic";

type NoteDetail = {
  id: string;
  title: string;
  note_state: NoteState;
  transcript: string;
  summary: string | null;
  action_items: unknown;
  summarized_at: string | null;
  created_at: string;
  meeting: { id: string; title: string | null } | null;
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title="Meeting Note" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { data } = await supabase
    .from("meeting_notes")
    .select(
      "id, title, note_state, transcript, summary, action_items, summarized_at, created_at, meeting:meeting_id(id, title:name)",
    )
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  const note = data as NoteDetail | null;
  if (!note) notFound();

  const items = parseActionItems(note.action_items);
  const pendingPush = items.filter((a) => !a.task_id).length;
  const aiConfigured = Boolean(env.ANTHROPIC_API_KEY);

  return (
    <>
      <ModuleHeader
        eyebrow="Meeting Note"
        title={note.title}
        action={
          <div className="flex items-center gap-2">
            <Button href="/studio/meetings/notes" variant="ghost" size="sm">
              Back
            </Button>
            <RecordActionButton
              label={note.note_state === "draft" ? "Summarize" : "Re-summarize"}
              variant="primary"
              action={summarizeNote.bind(null, note.id)}
              successMessage="Summary generated"
              confirm={
                note.note_state === "draft"
                  ? undefined
                  : {
                      body: "Re-run the AI summary? Existing action items keep any task links matched by text.",
                      confirmLabel: "Re-summarize",
                    }
              }
            />
            {note.note_state !== "archived" && (
              <RecordActionButton
                label="Archive"
                action={archiveNote.bind(null, note.id)}
                successMessage="Archived"
                confirm={{ body: "Archive this note?", confirmLabel: "Archive" }}
              />
            )}
            <DeleteForm
              action={deleteNote.bind(null, note.id)}
              confirm="Delete this meeting note? This cannot be undone."
            />
          </div>
        }
      />
      <div className="page-content space-y-5">
        <div className="surface flex flex-wrap items-center gap-3 p-4 text-xs">
          <StatusBadge status={note.note_state} />
          {note.meeting?.title && (
            <span className="text-[var(--p-text-2)]">
              Meeting:{" "}
              <a className="underline" href={`/studio/meetings/${note.meeting.id}`}>
                {note.meeting.title}
              </a>
            </span>
          )}
          <span className="font-mono text-[var(--p-text-2)]">
            Created {new Date(note.created_at).toLocaleDateString()}
          </span>
          {note.summarized_at && (
            <span className="font-mono text-[var(--p-text-2)]">
              Summarized {new Date(note.summarized_at).toLocaleDateString()}
            </span>
          )}
          {!aiConfigured && <Badge variant="warning">AI not configured</Badge>}
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Transcript */}
          <section className="surface space-y-2 p-5">
            <h2 className="text-sm font-semibold text-[var(--p-text-1)]">Transcript</h2>
            {note.transcript.trim() ? (
              <pre className="max-h-[28rem] overflow-auto font-mono text-xs whitespace-pre-wrap text-[var(--p-text-1)]">
                {note.transcript}
              </pre>
            ) : (
              <EmptyState
                size="compact"
                title="No transcript"
                description="Edit the note to paste a transcript, then run Summarize."
              />
            )}
          </section>

          {/* Summary */}
          <section className="surface space-y-2 p-5">
            <h2 className="text-sm font-semibold text-[var(--p-text-1)]">AI Summary</h2>
            {note.summary ? (
              <p className="text-sm whitespace-pre-wrap text-[var(--p-text-1)]">{note.summary}</p>
            ) : (
              <EmptyState
                size="compact"
                title="Not summarized yet"
                description="Run Summarize to generate a recap of this transcript."
              />
            )}
          </section>
        </div>

        {/* Action items */}
        <section className="surface space-y-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[var(--p-text-1)]">
              Action Items {items.length > 0 && <span className="text-[var(--p-text-2)]">({items.length})</span>}
            </h2>
            {pendingPush > 0 && (
              <RecordActionButton
                label={`Create ${pendingPush} task${pendingPush === 1 ? "" : "s"}`}
                variant="primary"
                action={createTasksFromActionItems.bind(null, note.id)}
                successMessage="Tasks created"
                confirm={{
                  body: `Create ${pendingPush} task${pendingPush === 1 ? "" : "s"} from the unlinked action items?`,
                  confirmLabel: "Create tasks",
                }}
              />
            )}
          </div>
          {items.length === 0 ? (
            <EmptyState
              size="compact"
              title="No action items"
              description="Action items appear here after you run Summarize on a transcript."
            />
          ) : (
            <ul className="divide-y divide-[var(--p-border)]">
              {items.map((a, i) => (
                <li key={i} className="flex flex-wrap items-center gap-2 py-2 text-sm">
                  <span className="flex-1 text-[var(--p-text-1)]">{a.text}</span>
                  {a.owner && <Badge variant="default">{a.owner}</Badge>}
                  {a.due && <span className="font-mono text-xs text-[var(--p-text-2)]">{a.due}</span>}
                  {a.task_id ? (
                    <a className="text-xs underline" href={`/studio/tasks/${a.task_id}`}>
                      <Badge variant="success">Task created</Badge>
                    </a>
                  ) : (
                    <Badge variant="warning">Unlinked</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
