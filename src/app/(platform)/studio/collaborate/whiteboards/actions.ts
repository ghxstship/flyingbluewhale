"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { actionFail, formFail } from "@/lib/forms/fail";
import { WHITEBOARD_STATES } from "@/lib/whiteboards";

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

const CreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
});

/** Create a board from the /new form, then open its canvas. */
export async function createWhiteboardAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can create whiteboards" };
  const parsed = CreateSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  const db = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = await db
    .from("whiteboards")
    .insert({
      org_id: session.orgId,
      name: parsed.data.name,
      created_by: session.userId,
      updated_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);

  revalidatePath("/studio/collaborate/whiteboards");
  redirect(`/studio/collaborate/whiteboards/${data.id}`);
}

/**
 * Persist the tldraw store snapshot for one board. Called by the canvas
 * island on a debounced cadence + explicit Save. The snapshot is opaque
 * JSON produced by `getSnapshot(editor.store)`; we accept it as a string
 * and parse it once at the boundary so a malformed payload can't write
 * garbage into the column.
 */
const SnapshotSchema = z.object({
  snapshot: z.string().min(2, "Empty snapshot"),
});

export async function saveWhiteboardSnapshotAction(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can edit whiteboards" };

  const parsed = SnapshotSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  let snapshot: unknown;
  try {
    snapshot = JSON.parse(parsed.data.snapshot);
  } catch {
    return { error: "Snapshot is not valid JSON" };
  }

  const db = (await createClient()) as unknown as LooseSupabase;
  const { error } = await db
    .from("whiteboards")
    .update({ snapshot, updated_by: session.userId })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (error) return actionFail(error.message, fd);

  revalidatePath(`/studio/collaborate/whiteboards/${id}`);
  revalidatePath("/studio/collaborate/whiteboards");
  return { ok: true };
}

const StateSchema = z.enum(WHITEBOARD_STATES);

/**
 * Toggle a board between active/archived from the canvas header. The target
 * state is bound as an arg (`.bind(null, id, state)`); used directly in a
 * `<form action>` so the trailing FormData is ignored.
 */
export async function setWhiteboardStateAction(id: string, state: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;

  const parsed = StateSchema.safeParse(state);
  if (!parsed.success) return;

  const db = (await createClient()) as unknown as LooseSupabase;
  await db
    .from("whiteboards")
    .update({ whiteboard_state: parsed.data, updated_by: session.userId })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);

  revalidatePath(`/studio/collaborate/whiteboards/${id}`);
  revalidatePath("/studio/collaborate/whiteboards");
}

/** Soft-delete a board. */
export async function deleteWhiteboardAction(id: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;

  const db = (await createClient()) as unknown as LooseSupabase;
  await db
    .from("whiteboards")
    .update({ deleted_at: new Date().toISOString(), updated_by: session.userId })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);

  revalidatePath("/studio/collaborate/whiteboards");
  redirect("/studio/collaborate/whiteboards");
}
