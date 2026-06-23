"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

const AddVersionSchema = z.object({
  sheet_set_id: z.string().uuid(),
  version_label: z.string().min(1).max(64),
});

export async function addVersion(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = AddVersionSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { data: parent } = await supabase
    .from("sheet_sets")
    .select("id")
    .eq("id", parsed.data.sheet_set_id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!parent) return;

  const { data: version, error } = await supabase
    .from("sheet_set_versions")
    .insert({
      org_id: session.orgId,
      sheet_set_id: parsed.data.sheet_set_id,
      version_label: parsed.data.version_label.trim(),
      set_state: "draft",
    })
    .select("id")
    .single();
  if (error || !version) return;

  const { error: updateError } = await supabase
    .from("sheet_sets")
    .update({ current_version_id: (version as { id: string }).id })
    .eq("id", parsed.data.sheet_set_id)
    .eq("org_id", session.orgId)
    .is("current_version_id", null);
  if (updateError) throw new Error(`Could not update sheet set: ${updateError.message}`);

  revalidatePath(`/studio/drawings/${parsed.data.sheet_set_id}`);
}

const AddMemberSchema = z.object({
  version_id: z.string().uuid(),
  site_plan_id: z.string().uuid(),
});

export async function addMember(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = AddMemberSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { data: version } = await supabase
    .from("sheet_set_versions")
    .select("id, sheet_set_id, set_state")
    .eq("id", parsed.data.version_id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!version) return;
  const v = version as { id: string; sheet_set_id: string; set_state: string };
  if (v.set_state === "published") return;

  const { data: sitePlan } = await supabase
    .from("site_plans")
    .select("id, revision_letter")
    .eq("id", parsed.data.site_plan_id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!sitePlan) return;

  const { data: existing } = await supabase
    .from("sheet_set_members")
    .select("ordinal")
    .eq("sheet_set_version_id", parsed.data.version_id)
    .eq("org_id", session.orgId)
    .order("ordinal", { ascending: false })
    .limit(1);
  const existingRows = (existing ?? []) as Array<{ ordinal: number }>;
  const nextOrdinal = existingRows[0] ? existingRows[0].ordinal + 1 : 1;

  const { error } = await supabase.from("sheet_set_members").insert({
    org_id: session.orgId,
    sheet_set_version_id: parsed.data.version_id,
    site_plan_id: parsed.data.site_plan_id,
    revision_letter_at_publish: (sitePlan as { revision_letter: string | null }).revision_letter,
    ordinal: nextOrdinal,
  });
  if (error) throw new Error(`Could not create sheet set member: ${error.message}`);

  revalidatePath(`/studio/drawings/${v.sheet_set_id}`);
}

const VersionIdSchema = z.object({ version_id: z.string().uuid() });

export async function publishVersion(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = VersionIdSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { data: version } = await supabase
    .from("sheet_set_versions")
    .select("id, sheet_set_id, set_state")
    .eq("id", parsed.data.version_id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!version) return;
  const v = version as { id: string; sheet_set_id: string; set_state: string };
  if (v.set_state === "published") return;

  const { error: updateError } = await supabase
    .from("sheet_set_versions")
    .update({
      set_state: "published",
      published_at: new Date().toISOString(),
      published_by: session.userId,
    })
    .eq("id", v.id)
    .eq("org_id", session.orgId);
  if (updateError) throw new Error(`Could not update sheet set version: ${updateError.message}`);

  const { error } = await supabase
    .from("sheet_sets")
    .update({ current_version_id: v.id })
    .eq("id", v.sheet_set_id)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not update sheet set: ${error.message}`);

  revalidatePath(`/studio/drawings/${v.sheet_set_id}`);
}

export async function supersedeVersion(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = VersionIdSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { data: version } = await supabase
    .from("sheet_set_versions")
    .select("id, sheet_set_id, set_state")
    .eq("id", parsed.data.version_id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!version) return;
  const v = version as { id: string; sheet_set_id: string; set_state: string };

  const { error } = await supabase
    .from("sheet_set_versions")
    .update({
      set_state: "superseded",
      superseded_at: new Date().toISOString(),
    })
    .eq("id", v.id)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not update sheet set version: ${error.message}`);

  revalidatePath(`/studio/drawings/${v.sheet_set_id}`);
}
