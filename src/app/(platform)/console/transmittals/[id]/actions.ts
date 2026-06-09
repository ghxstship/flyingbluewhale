"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

const TransmittalIdSchema = z.object({ transmittal_id: z.string().uuid() });

async function loadTransmittal(supabase: LooseSupabase, transmittalId: string, orgId: string) {
  const { data } = await supabase
    .from("transmittals")
    .select("id, transmittal_state, project_id")
    .eq("id", transmittalId)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .maybeSingle();
  return data as { id: string; transmittal_state: string; project_id: string } | null;
}

export async function sendTransmittal(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = TransmittalIdSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const t = await loadTransmittal(supabase, parsed.data.transmittal_id, session.orgId);
  if (!t || t.transmittal_state !== "draft") return;

  // Require at least one recipient.
  const { data: recipientCount } = await supabase
    .from("transmittal_recipients")
    .select("id")
    .eq("transmittal_id", t.id)
    .limit(1);
  if (!recipientCount || recipientCount.length === 0) return;

  const { error: updateError } = await supabase
    .from("transmittals")
    .update({
      transmittal_state: "sent",
      sent_at: new Date().toISOString(),
      sent_by: session.userId,
    })
    .eq("id", t.id)
    .eq("org_id", session.orgId);
  if (updateError) throw new Error(`Could not update transmittal: ${updateError.message}`);

  // Mark delivery for in-app user recipients immediately. Vendor + external
  // recipients get queued in the dispatch worker (not built yet — placeholder).
  const { error } = await supabase
    .from("transmittal_recipients")
    .update({ delivered_at: new Date().toISOString() })
    .eq("transmittal_id", t.id)
    .eq("recipient_kind", "user");
  if (error) throw new Error(`Could not update transmittal recipient: ${error.message}`);

  revalidatePath(`/console/transmittals/${t.id}`);
}

export async function closeTransmittal(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = TransmittalIdSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const t = await loadTransmittal(supabase, parsed.data.transmittal_id, session.orgId);
  if (!t || t.transmittal_state === "closed" || t.transmittal_state === "voided") return;

  const { error } = await supabase
    .from("transmittals")
    .update({
      transmittal_state: "closed",
      closed_at: new Date().toISOString(),
      closed_by: session.userId,
    })
    .eq("id", t.id)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not update transmittal: ${error.message}`);

  revalidatePath(`/console/transmittals/${t.id}`);
}

const AddRecipientSchema = z
  .object({
    transmittal_id: z.string().uuid(),
    recipient_kind: z.enum(["user", "vendor", "external_email"]),
    user_id: z.string().uuid().optional().or(z.literal("")),
    vendor_id: z.string().uuid().optional().or(z.literal("")),
    external_email: z.string().email().optional().or(z.literal("")),
    cc: z.string().optional(),
  })
  .refine(
    (v) => {
      if (v.recipient_kind === "user") return !!v.user_id;
      if (v.recipient_kind === "vendor") return !!v.vendor_id;
      return !!v.external_email;
    },
    { message: "Pick a recipient matching the kind" },
  );

export async function addRecipient(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = AddRecipientSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const t = await loadTransmittal(supabase, parsed.data.transmittal_id, session.orgId);
  if (!t || t.transmittal_state !== "draft") return;

  const { error } = await supabase.from("transmittal_recipients").insert({
    org_id: session.orgId,
    transmittal_id: t.id,
    recipient_kind: parsed.data.recipient_kind,
    user_id: parsed.data.recipient_kind === "user" ? parsed.data.user_id || null : null,
    vendor_id: parsed.data.recipient_kind === "vendor" ? parsed.data.vendor_id || null : null,
    external_email: parsed.data.recipient_kind === "external_email" ? parsed.data.external_email || null : null,
    cc: parsed.data.cc === "1",
  });
  if (error) throw new Error(`Could not create transmittal recipient: ${error.message}`);

  revalidatePath(`/console/transmittals/${t.id}`);
}

const AddItemSchema = z.object({
  transmittal_id: z.string().uuid(),
  item_type: z.enum(["site_plan", "sheet_set_version", "spec_section", "submittal", "rfi", "deliverable", "file"]),
  item_id: z.string().uuid(),
  description: z.string().max(400).optional(),
});

export async function addItem(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = AddItemSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const t = await loadTransmittal(supabase, parsed.data.transmittal_id, session.orgId);
  if (!t || t.transmittal_state !== "draft") return;

  const { data: existing } = await supabase
    .from("transmittal_items")
    .select("ordinal")
    .eq("transmittal_id", t.id)
    .order("ordinal", { ascending: false })
    .limit(1);
  const existingRows = (existing ?? []) as Array<{ ordinal: number }>;
  const nextOrdinal = existingRows[0] ? existingRows[0].ordinal + 1 : 1;

  const { error } = await supabase.from("transmittal_items").insert({
    org_id: session.orgId,
    transmittal_id: t.id,
    item_type: parsed.data.item_type,
    item_id: parsed.data.item_id,
    description: parsed.data.description || null,
    ordinal: nextOrdinal,
  });
  if (error) throw new Error(`Could not create transmittal item: ${error.message}`);

  revalidatePath(`/console/transmittals/${t.id}`);
}
