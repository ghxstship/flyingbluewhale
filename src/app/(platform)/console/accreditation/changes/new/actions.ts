"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  accreditation_id: z.string().uuid(),
  kind: z.string().min(1).max(60),
  note: z.string().max(2000).optional(),
});

export type State = { error?: string } | null;

export async function createChange(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accreditation_changes")
    .insert({
      org_id: session.orgId,
      accreditation_id: parsed.data.accreditation_id,
      kind: parsed.data.kind,
      note: parsed.data.note || null,
      status: "pending",
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/console/accreditation/changes");
  redirect(`/console/accreditation/changes/${data.id}`);
}
