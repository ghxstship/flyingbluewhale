"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { actionFail, formFail } from "@/lib/forms/fail";
import { parseActionItems, type ActionItem } from "@/lib/meeting-notes";
import { summarizeTranscript } from "@/lib/ai/meeting-summary";

const CreateSchema = z.object({
  title: z.string().min(1).max(200),
  meeting_id: z.string().uuid().optional().or(z.literal("")),
  transcript: z.string().max(200_000).optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

type NoteRow = {
  id: string;
  org_id: string;
  transcript: string;
  action_items: unknown;
  note_state: string;
};

async function loadNote(supabase: LooseSupabase, orgId: string, id: string): Promise<NoteRow | null> {
  const { data } = await supabase
    .from("meeting_notes")
    .select("id, org_id, transcript, action_items, note_state")
    .eq("id", id)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .maybeSingle();
  return (data as NoteRow | null) ?? null;
}

export async function createNote(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "You do not have permission to create meeting notes." };
  const parsed = CreateSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = (await createClient()) as unknown as LooseSupabase;

  if (parsed.data.meeting_id) {
    const { data: meeting } = await supabase
      .from("events")
      .select("id")
      .eq("id", parsed.data.meeting_id)
      .eq("org_id", session.orgId)
      .eq("event_kind", "meeting")
      .maybeSingle();
    if (!meeting) return { error: "Meeting not found in your organization" };
  }

  const { data: row, error } = await supabase
    .from("meeting_notes")
    .insert({
      org_id: session.orgId,
      meeting_id: parsed.data.meeting_id || null,
      title: parsed.data.title,
      transcript: parsed.data.transcript || "",
      note_state: "draft",
      action_items: [],
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);

  revalidatePath("/studio/meetings/notes");
  redirect(`/studio/meetings/notes/${(row as { id: string }).id}`);
}

/** Run the transcript through Anthropic → store summary + action items. */
export async function summarizeNote(id: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const note = await loadNote(supabase, session.orgId, id);
  if (!note) return;

  const result = await summarizeTranscript(note.transcript ?? "");
  if ("error" in result) {
    // Surface nothing destructive — leave the note as-is. The detail page
    // re-reads on revalidate; transient AI failures are retryable via the
    // same button.
    revalidatePath(`/studio/meetings/notes/${id}`);
    return;
  }

  // Preserve any task_id already pushed for items that survive a re-run by
  // matching on text; new items start unlinked.
  const prior = parseActionItems(note.action_items);
  const priorByText = new Map(prior.map((a) => [a.text, a.task_id ?? null]));
  const merged: ActionItem[] = result.actionItems.map((a) => ({
    ...a,
    task_id: priorByText.get(a.text) ?? null,
  }));

  await supabase
    .from("meeting_notes")
    .update({
      summary: result.summary,
      action_items: merged,
      note_state: "summarized",
      summarized_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("org_id", session.orgId);

  revalidatePath(`/studio/meetings/notes/${id}`);
  revalidatePath("/studio/meetings/notes");
}

/** Insert a `tasks` row for each action item not yet linked to one. */
export async function createTasksFromActionItems(id: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const note = await loadNote(supabase, session.orgId, id);
  if (!note) return;

  const items = parseActionItems(note.action_items);
  const pending = items.filter((a) => !a.task_id);
  if (pending.length === 0) return;

  const updated: ActionItem[] = [];
  for (const item of items) {
    if (item.task_id) {
      updated.push(item);
      continue;
    }
    const description = item.owner ? `Owner: ${item.owner}` : null;
    const { data: task, error } = await supabase
      .from("tasks")
      .insert({
        org_id: session.orgId,
        title: item.text.slice(0, 200),
        description,
        due_at: item.due || null,
        task_state: "todo",
        created_by: session.userId,
      })
      .select("id")
      .single();
    if (error || !task) {
      updated.push(item);
      continue;
    }
    updated.push({ ...item, task_id: (task as { id: string }).id });
  }

  await supabase.from("meeting_notes").update({ action_items: updated }).eq("id", id).eq("org_id", session.orgId);

  revalidatePath(`/studio/meetings/notes/${id}`);
  revalidatePath("/studio/meetings/notes");
}

export async function archiveNote(id: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const supabase = (await createClient()) as unknown as LooseSupabase;
  await supabase.from("meeting_notes").update({ note_state: "archived" }).eq("id", id).eq("org_id", session.orgId);
  revalidatePath(`/studio/meetings/notes/${id}`);
  revalidatePath("/studio/meetings/notes");
}

export async function deleteNote(id: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const supabase = (await createClient()) as unknown as LooseSupabase;
  await supabase
    .from("meeting_notes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", session.orgId);
  revalidatePath("/studio/meetings/notes");
  // No redirect — DeleteForm's undo flow navigates client-side after
  // showing the "Deleted" toast with its Undo action (REC-14).
}
