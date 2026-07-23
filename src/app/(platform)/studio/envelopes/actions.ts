"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getOrgScoped } from "@/lib/db/resource";
import { actionFail, formFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

const PROVIDERS = ["docusign", "adobe_sign", "hellosign", "pandadoc", "manual"] as const;
const TARGET_TYPES = [
  "proposal",
  "offer_letter",
  "msa",
  "prime_contract",
  "sub_contract",
  "change_order",
  "lien_waiver",
  "nda",
  "other",
] as const;

const Schema = z.object({
  subject: z.string().min(1).max(300),
  provider: z.enum(PROVIDERS),
  target_type: z.enum(TARGET_TYPES),
  target_id: z.string().uuid(),
  project_id: z.string().uuid().optional().or(z.literal("")),
  body_md: z.string().max(20000).optional(),
  expires_at: z.string().date().optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createEnvelopeAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  // E-sign envelopes are legal instruments; manager+ only at app layer
  // (mirrors the RLS write policy on contract_envelopes).
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.create-envelopes", "Only manager+ can create envelopes") };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  const supabase = await createClient();

  // Cross-tenant FK guard on the optional project link.
  const projectId = parsed.data.project_id || null;
  if (projectId) {
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!project) return { error: actionErrorMessage("not-found.project-in-org", "Project not found in your organization") };
  }

  const { data, error } = await supabase
    .from("contract_envelopes")
    .insert({
      org_id: session.orgId,
      subject: parsed.data.subject,
      provider: parsed.data.provider,
      target_type: parsed.data.target_type,
      target_id: parsed.data.target_id,
      project_id: projectId,
      body_md: parsed.data.body_md || null,
      expires_at: parsed.data.expires_at || null,
      created_by: session.userId,
    })
    .select()
    .single();
  if (error) return actionFail(error.message, fd);
  revalidatePath("/studio/envelopes");
  redirect(`/studio/envelopes/${data.id}`);
}

// Manual-provider lifecycle. DocuSign/Adobe/etc. drive their own state via
// the provider webhook (/api/v1/webhooks/docusign); the manual transitions
// below cover the operator-driven arc and the universal void escape hatch.
const ENVELOPE_TRANSITIONS: Record<string, readonly string[]> = {
  drafted: ["sent", "voided"],
  sent: ["delivered", "partially_signed", "completed", "declined", "voided", "expired"],
  delivered: ["partially_signed", "completed", "declined", "voided", "expired"],
  partially_signed: ["completed", "declined", "voided", "expired"],
  signed: ["completed", "voided"],
  completed: [],
  declined: [],
  voided: [],
  expired: [],
};

export async function setEnvelopeStateAction(
  id: string,
  next:
    | "drafted"
    | "sent"
    | "delivered"
    | "partially_signed"
    | "signed"
    | "completed"
    | "declined"
    | "voided"
    | "expired",
): Promise<{ error?: string } | undefined> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.change-envelope-state", "Only manager+ can change envelope state") };

  const before = await getOrgScoped("contract_envelopes", session.orgId, id);
  if (!before) return { error: actionErrorMessage("not-found.envelope", "Envelope not found") };

  const allowed = ENVELOPE_TRANSITIONS[before.envelope_state] ?? [];
  if (!allowed.includes(next)) {
    return { error: `Cannot move envelope from ${before.envelope_state} to ${next}` };
  }

  const supabase = await createClient();
  const patch: { envelope_state: typeof next; sent_at?: string; completed_at?: string } = {
    envelope_state: next,
  };
  if (next === "sent" && !before.sent_at) patch.sent_at = new Date().toISOString();
  if ((next === "completed" || next === "signed") && !before.completed_at) {
    patch.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("contract_envelopes")
    .update(patch)
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/studio/envelopes/${id}`);
  revalidatePath("/studio/envelopes");
}

export async function deleteEnvelopeAction(id: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) throw new Error("Only manager+ can delete envelopes");
  const supabase = await createClient();
  const { error } = await supabase
    .from("contract_envelopes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) throw new Error(error.message);
  revalidatePath("/studio/envelopes");
}
