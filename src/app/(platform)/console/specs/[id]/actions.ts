"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

const Schema = z.object({ section_id: z.string().uuid() });

export async function issueSection(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { data: section } = await supabase
    .from("spec_sections")
    .select("id, section_state")
    .eq("id", parsed.data.section_id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!section) return;
  const s = section as { id: string; section_state: string };
  if (s.section_state === "issued" || s.section_state === "superseded") return;

  const { error } = await supabase
    .from("spec_sections")
    .update({
      section_state: "issued",
      issued_at: new Date().toISOString(),
      issued_by: session.userId,
    })
    .eq("id", s.id)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not update spec section: ${error.message}`);

  revalidatePath(`/console/specs/${s.id}`);
}

export async function supersedeSection(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { data: section } = await supabase
    .from("spec_sections")
    .select("id, section_state")
    .eq("id", parsed.data.section_id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!section) return;
  const s = section as { id: string; section_state: string };

  const { error } = await supabase
    .from("spec_sections")
    .update({
      section_state: "superseded",
      superseded_at: new Date().toISOString(),
    })
    .eq("id", s.id)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not update spec section: ${error.message}`);

  revalidatePath(`/console/specs/${s.id}`);
}
