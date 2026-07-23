"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

const Schema = z.object({
  accreditation_id: z.string().uuid(),
  kind: z.string().min(1).max(60),
  note: z.string().max(2000).optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createChange(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  // Cross-tenant FK guard on accreditation_id.
  const { data: accreditation } = await supabase
    .from("accreditations")
    .select("id")
    .eq("id", parsed.data.accreditation_id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!accreditation) return { error: actionErrorMessage("not-found.accreditation-in-org", "Accreditation not found in your organization") };

  const { data, error } = await supabase
    .from("accreditation_changes")
    .insert({
      org_id: session.orgId,
      accreditation_id: parsed.data.accreditation_id,
      kind: parsed.data.kind,
      note: parsed.data.note || null,
      change_state: "pending",
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);
  revalidatePath("/studio/accreditation/changes");
  redirect(`/studio/accreditation/changes/${data.id}`);
}
