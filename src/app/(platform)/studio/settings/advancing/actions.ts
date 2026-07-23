"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import { ADVANCE_SECTION_KEYS, ADVANCE_REQUIREMENTS } from "@/lib/db/advance-packets";

const PATH = "/studio/settings/advancing";

const Schema = z.object({
  audience_type: z
    .string()
    .min(1)
    .max(80)
    .transform((v) => v.trim().toLowerCase().replace(/\s+/g, "_")),
  section_key: z.enum(ADVANCE_SECTION_KEYS),
  requirement: z.enum(ADVANCE_REQUIREMENTS),
  // Optional numeric: an untouched input posts "" — coerce would store 0
  // instead of "no offset". Empty means null.
  due_offset_days: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().int().min(0).max(365).optional(),
  ),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function addPresetAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can edit advancing presets" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  // The (org, audience_type, section_key) pair is unique among live rows —
  // update in place instead of erroring on the partial index.
  const { data: existing } = await supabase
    .from("org_advance_presets")
    .select("id")
    .eq("org_id", session.orgId)
    .eq("audience_type", parsed.data.audience_type)
    .eq("section_key", parsed.data.section_key)
    .is("deleted_at", null)
    .maybeSingle();
  if (existing) {
    const { error } = await supabase
      .from("org_advance_presets")
      .update({
        requirement: parsed.data.requirement,
        due_offset_days: parsed.data.due_offset_days ?? null,
      })
      .eq("id", existing.id)
      .eq("org_id", session.orgId);
    if (error) return actionFail(error.message, fd);
  } else {
    const { error } = await supabase.from("org_advance_presets").insert({
      org_id: session.orgId,
      audience_type: parsed.data.audience_type,
      section_key: parsed.data.section_key,
      requirement: parsed.data.requirement,
      due_offset_days: parsed.data.due_offset_days ?? null,
    } as never);
    if (error) return actionFail(error.message, fd);
  }
  revalidatePath(PATH);
  return { ok: true };
}

export async function deletePresetAction(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const id = String(fd.get("preset_id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase
    .from("org_advance_presets")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", session.orgId);
  revalidatePath(PATH);
}

/** W6 a11y — id-arg binding for `DeleteForm` (the confirm dialog invokes the
 * action directly rather than posting a hidden-input form). */
export async function deletePresetById(id: string): Promise<void> {
  const fd = new FormData();
  fd.set("preset_id", id);
  await deletePresetAction(fd);
}
