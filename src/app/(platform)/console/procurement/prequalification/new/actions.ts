"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  vendor_id: z.string().uuid(),
  questionnaire_id: z.string().uuid(),
  expires_at: z.string().optional(),
});

export type State = { error?: string } | null;

export async function invitePrequalification(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vendor_prequalifications")
    .insert({
      org_id: session.orgId,
      vendor_id: parsed.data.vendor_id,
      questionnaire_id: parsed.data.questionnaire_id,
      expires_at: parsed.data.expires_at || null,
    } as never)
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return { error: "Vendor already invited to this questionnaire." };
    return { error: error.message };
  }
  revalidatePath("/console/procurement/prequalification");
  redirect(`/console/procurement/prequalification/${data.id}`);
}
