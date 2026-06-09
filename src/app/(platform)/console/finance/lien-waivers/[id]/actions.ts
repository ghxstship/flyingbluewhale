"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

const IdSchema = z.object({ waiver_id: z.string().uuid() });

async function loadWaiver(supabase: LooseSupabase, id: string, orgId: string) {
  const { data } = await supabase
    .from("lien_waivers")
    .select("id, waiver_state")
    .eq("id", id)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .maybeSingle();
  return data as { id: string; waiver_state: string } | null;
}

const SendSchema = IdSchema.extend({ envelope_id: z.string().max(120).optional() });

export async function sendWaiver(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = SendSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const w = await loadWaiver(supabase, parsed.data.waiver_id, session.orgId);
  if (!w || w.waiver_state !== "drafted") return;

  const { error } = await supabase
    .from("lien_waivers")
    .update({
      waiver_state: "sent",
      sent_at: new Date().toISOString(),
      envelope_id: parsed.data.envelope_id?.trim() || null,
    })
    .eq("id", w.id)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not send waiver: ${error.message}`);

  revalidatePath(`/console/finance/lien-waivers/${w.id}`);
}

const SigSchema = IdSchema.extend({
  signer_name: z.string().min(1).max(120),
  signer_title: z.string().max(120).optional(),
});

export async function recordSignature(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = SigSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const w = await loadWaiver(supabase, parsed.data.waiver_id, session.orgId);
  if (!w || (w.waiver_state !== "drafted" && w.waiver_state !== "sent")) return;

  const { error } = await supabase
    .from("lien_waivers")
    .update({
      waiver_state: "signed",
      signed_at: new Date().toISOString(),
      signer_name: parsed.data.signer_name,
      signer_title: parsed.data.signer_title || null,
    })
    .eq("id", w.id)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not record signature: ${error.message}`);

  revalidatePath(`/console/finance/lien-waivers/${w.id}`);
}

export async function markReturned(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = IdSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const w = await loadWaiver(supabase, parsed.data.waiver_id, session.orgId);
  if (!w || w.waiver_state !== "signed") return;

  const { error } = await supabase
    .from("lien_waivers")
    .update({ waiver_state: "returned", returned_at: new Date().toISOString() })
    .eq("id", w.id)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not mark waiver returned: ${error.message}`);

  revalidatePath(`/console/finance/lien-waivers/${w.id}`);
}

export async function releaseWaiver(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = IdSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const w = await loadWaiver(supabase, parsed.data.waiver_id, session.orgId);
  if (!w || w.waiver_state !== "returned") return;

  const { error } = await supabase
    .from("lien_waivers")
    .update({ waiver_state: "released", released_at: new Date().toISOString() })
    .eq("id", w.id)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not release waiver: ${error.message}`);

  revalidatePath(`/console/finance/lien-waivers/${w.id}`);
}

const VoidSchema = IdSchema.extend({ reason: z.string().max(400).optional() });

export async function voidWaiver(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = VoidSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const w = await loadWaiver(supabase, parsed.data.waiver_id, session.orgId);
  if (!w || w.waiver_state === "voided" || w.waiver_state === "released") return;

  const { error } = await supabase
    .from("lien_waivers")
    .update({
      waiver_state: "voided",
      voided_at: new Date().toISOString(),
      voided_reason: parsed.data.reason || null,
    })
    .eq("id", w.id)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not void waiver: ${error.message}`);

  revalidatePath(`/console/finance/lien-waivers/${w.id}`);
}
