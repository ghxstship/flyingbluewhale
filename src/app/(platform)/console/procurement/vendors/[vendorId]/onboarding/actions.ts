"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

export type State = { error?: string } | null;

const ITEM_STATES = ["pending", "submitted", "approved", "waived"] as const;
export type OnboardingItemState = (typeof ITEM_STATES)[number];

/** Standard due-diligence checklist seeded for a new vendor. */
const DEFAULT_ITEMS: Array<{ label: string; required: boolean }> = [
  { label: "W-9 / tax form on file", required: true },
  { label: "Certificate of Insurance (COI)", required: true },
  { label: "Signed NDA", required: false },
  { label: "Banking / ACH details", required: true },
  { label: "Master Service Agreement (MSA)", required: true },
  { label: "References checked", required: false },
];

async function guardVendor(vendorId: string, orgId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vendors")
    .select("id")
    .eq("id", vendorId)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .maybeSingle();
  return !!data;
}

const AddSchema = z.object({
  label: z.string().trim().min(1).max(160),
  required: z.coerce.boolean().optional(),
});

export async function addOnboardingItem(vendorId: string, _prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Manager access required" };
  const parsed = AddSchema.safeParse({ label: fd.get("label"), required: fd.get("required") === "on" });
  if (!parsed.success) return { error: "Enter a label for the requirement" };
  if (!(await guardVendor(vendorId, session.orgId))) return { error: "Vendor not found" };

  const db = (await createClient()) as unknown as LooseSupabase;
  const { error } = await db.from("vendor_onboarding_items").insert({
    org_id: session.orgId,
    vendor_id: vendorId,
    label: parsed.data.label,
    required: parsed.data.required ?? true,
    item_state: "pending",
  });
  if (error) return { error: error.message };
  revalidatePath(`/console/procurement/vendors/${vendorId}/onboarding`);
  return null;
}

export async function setOnboardingItemState(
  vendorId: string,
  itemId: string,
  state: OnboardingItemState,
): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Manager access required" };
  if (!ITEM_STATES.includes(state)) return { error: "Invalid state" };

  const db = (await createClient()) as unknown as LooseSupabase;
  const completedAt = state === "approved" || state === "waived" ? new Date().toISOString() : null;
  const { error } = await db
    .from("vendor_onboarding_items")
    .update({ item_state: state, completed_at: completedAt })
    .eq("id", itemId)
    .eq("org_id", session.orgId)
    .eq("vendor_id", vendorId);
  if (error) return { error: error.message };
  revalidatePath(`/console/procurement/vendors/${vendorId}/onboarding`);
  return null;
}

export async function renameOnboardingItem(vendorId: string, itemId: string, label: string): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Manager access required" };
  const trimmed = label.trim();
  if (!trimmed || trimmed.length > 160) return { error: "Label must be 1–160 characters" };
  const db = (await createClient()) as unknown as LooseSupabase;
  const { error } = await db
    .from("vendor_onboarding_items")
    .update({ label: trimmed })
    .eq("id", itemId)
    .eq("org_id", session.orgId)
    .eq("vendor_id", vendorId);
  if (error) return { error: error.message };
  revalidatePath(`/console/procurement/vendors/${vendorId}/onboarding`);
  return null;
}

export async function deleteOnboardingItem(vendorId: string, itemId: string): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Manager access required" };
  const db = (await createClient()) as unknown as LooseSupabase;
  const { error } = await db
    .from("vendor_onboarding_items")
    .delete()
    .eq("id", itemId)
    .eq("org_id", session.orgId)
    .eq("vendor_id", vendorId);
  if (error) return { error: error.message };
  revalidatePath(`/console/procurement/vendors/${vendorId}/onboarding`);
  return null;
}

export async function seedOnboardingDefaults(vendorId: string): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Manager access required" };
  if (!(await guardVendor(vendorId, session.orgId))) return { error: "Vendor not found" };

  const db = (await createClient()) as unknown as LooseSupabase;
  const { data: existing } = await db
    .from("vendor_onboarding_items")
    .select("id")
    .eq("org_id", session.orgId)
    .eq("vendor_id", vendorId)
    .limit(1);
  if (Array.isArray(existing) && existing.length > 0) return { error: "Checklist already started" };

  const { error } = await db.from("vendor_onboarding_items").insert(
    DEFAULT_ITEMS.map((it, i) => ({
      org_id: session.orgId,
      vendor_id: vendorId,
      label: it.label,
      required: it.required,
      item_state: "pending",
      sort_order: i,
    })),
  );
  if (error) return { error: error.message };
  revalidatePath(`/console/procurement/vendors/${vendorId}/onboarding`);
  return null;
}
