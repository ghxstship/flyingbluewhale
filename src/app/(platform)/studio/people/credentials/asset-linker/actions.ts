"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

const Schema = z.object({
  assignment_id: z.string().uuid(),
  kind: z.enum(["nfc", "rfid", "barcode", "qr", "wristband_serial"]),
  code: z.string().min(1).max(120),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

/**
 * Bind a physical scan token (NFC tag, RFID card, barcode, QR, wristband)
 * to a credential-kind assignment. Replaces the legacy asset_links
 * binding to a `credentials` row — now everything attaches at the
 * assignment level via assignment_scan_codes. One row per active token;
 * voiding a row lets the same code be re-issued later.
 */
export async function linkAssetAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.bind-scan-codes", "Only manager+ can bind scan codes") };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  const { data: a } = await supabase
    .from("assignments")
    .select("id, catalog_kind")
    .eq("id", parsed.data.assignment_id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!a) return { error: actionErrorMessage("not-found.assignment-in-org", "Assignment not found in your organization") };

  const { error } = await supabase.from("assignment_scan_codes").insert({
    assignment_id: parsed.data.assignment_id,
    org_id: session.orgId,
    kind: parsed.data.kind,
    code: parsed.data.code,
  });
  if (error) {
    // Most likely a unique-violation on (org_id, code) WHERE active.
    return { error: actionErrorMessage("that-code-is-already-active-on-another-assignment-void", "That code is already active on another assignment. Void it before re-issuing.") };
  }
  revalidatePath("/studio/people/credentials/asset-linker");
  return null;
}

export async function revokeLinkAction(formData: FormData) {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("assignment_scan_codes")
    .update({ active: false, voided_at: new Date().toISOString(), voided_by: session.userId })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not update assignment scan code: ${error.message}`);
  revalidatePath("/studio/people/credentials/asset-linker");
}
