"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { formFail } from "@/lib/forms/fail";
import { emitAudit } from "@/lib/audit";
import { actionErrorMessage } from "@/lib/errors";

const Schema = z.object({
  requester_email: z.string().email(),
  kind: z.string(),
  request_state: z.string(),
  due_by: z.string().optional().or(z.literal("")),
  notes: z.string().max(4000).optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateDsarRequest(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("dsar_requests", session.orgId, id, expectedUpdatedAt, {
    requester_email: parsed.data.requester_email,
    kind: parsed.data.kind as "access" | "deletion" | "correction" | "portability" | "objection",
    request_state: parsed.data.request_state as "received" | "verifying" | "in_progress" | "fulfilled" | "rejected",
    due_by: parsed.data.due_by || null,
    notes: parsed.data.notes || null,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : actionErrorMessage("not-found.dsar-request", "Dsar Request not found.") };
  }
  // GDPR — audit fulfilment (the Art. 15/17/20 close-out is the most
  // litigation-relevant transition); audit any other state change too.
  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: parsed.data.request_state === "fulfilled" ? "privacy.dsar.fulfilled" : "privacy.dsar.created",
    targetTable: "dsar_requests",
    targetId: id,
    metadata: { kind: parsed.data.kind, request_state: parsed.data.request_state },
  });
  revalidatePath(`/studio/legal/privacy/dsar/${id}`);
  revalidatePath("/studio/legal/privacy/dsar");
  redirect(`/studio/legal/privacy/dsar/${id}`);
}

export async function deleteDsarRequest(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase.from("dsar_requests").delete().eq("id", id).eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete dsar request: ${error.message}`);
  revalidatePath("/studio/legal/privacy/dsar");
  redirect("/studio/legal/privacy/dsar");
}
