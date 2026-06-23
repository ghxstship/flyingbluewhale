"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import { classifyScan, generateScanCode, type GuestEntryState, type GuestScanResult } from "@/lib/box_office";

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

// ── create guest list ───────────────────────────────────────────────
const ListSchema = z.object({
  name: z.string().min(1).max(160),
  event_id: z.string().uuid().optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export async function createGuestListAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can create guest lists" };
  const parsed = ListSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("guest_lists" as never)
    .insert({
      org_id: session.orgId,
      name: parsed.data.name,
      event_id: parsed.data.event_id || null,
      notes: parsed.data.notes || null,
      created_by: session.userId,
    } as never)
    .select("id")
    .single();

  if (error) return actionFail(error.message, fd);
  revalidatePath("/studio/marketplace/box-office");
  redirect(`/studio/marketplace/box-office/${(data as { id: string }).id}`);
}

// ── add guest entry ─────────────────────────────────────────────────
const EntrySchema = z.object({
  guest_list_id: z.string().uuid(),
  guest_name: z.string().min(1).max(200),
  plus_ones: z.coerce.number().int().min(0).max(99).default(0),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export async function addGuestEntryAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can edit guest lists" };
  const parsed = EntrySchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  // Confirm the list belongs to the caller's org before inserting under it.
  const { data: list } = await supabase
    .from("guest_lists" as never)
    .select("id")
    .eq("id", parsed.data.guest_list_id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!list) return { error: "Guest list not found" };

  const { error } = await supabase.from("guest_list_entries" as never).insert({
    org_id: session.orgId,
    guest_list_id: parsed.data.guest_list_id,
    guest_name: parsed.data.guest_name,
    plus_ones: parsed.data.plus_ones,
    notes: parsed.data.notes || null,
    scan_code: generateScanCode(),
    entry_state: "pending" satisfies GuestEntryState,
  } as never);

  if (error) return actionFail(error.message, fd);
  revalidatePath(`/studio/marketplace/box-office/${parsed.data.guest_list_id}`);
  return { ok: true };
}

// ── door check-in (manual, by entry id) ─────────────────────────────
// Door FSM is guarded server-side: pending -> arrived stamps checked_in_at;
// re-checking an already-arrived entry is a no-op duplicate. A stale tab can
// not jump the rails because the conditional update matches on entry_state.
export async function checkInEntryAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can work the door" };
  const entryId = String(fd.get("entry_id") ?? "");
  const listId = String(fd.get("guest_list_id") ?? "");
  if (!entryId) return { error: "Missing entry" };
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("guest_list_entries" as never)
    .update({
      entry_state: "arrived" satisfies GuestEntryState,
      checked_in_at: new Date().toISOString(),
      checked_in_by: session.userId,
    } as never)
    .eq("id", entryId)
    .eq("org_id", session.orgId)
    .eq("entry_state", "pending")
    .select("id");
  if (error) return { error: error.message };
  if (!data || (data as unknown[]).length === 0) return { error: "Only a pending guest can be checked in" };
  if (listId) revalidatePath(`/studio/marketplace/box-office/${listId}`);
  return { ok: true };
}

// ── deny entry ──────────────────────────────────────────────────────
export async function denyEntryAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can work the door" };
  const entryId = String(fd.get("entry_id") ?? "");
  const listId = String(fd.get("guest_list_id") ?? "");
  if (!entryId) return { error: "Missing entry" };
  const supabase = await createClient();

  const { error } = await supabase
    .from("guest_list_entries" as never)
    .update({ entry_state: "denied" satisfies GuestEntryState } as never)
    .eq("id", entryId)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  if (listId) revalidatePath(`/studio/marketplace/box-office/${listId}`);
  return { ok: true };
}

// ── reset entry to pending (re-scan) ────────────────────────────────
export async function resetEntryAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can work the door" };
  const entryId = String(fd.get("entry_id") ?? "");
  const listId = String(fd.get("guest_list_id") ?? "");
  if (!entryId) return { error: "Missing entry" };
  const supabase = await createClient();

  const { error } = await supabase
    .from("guest_list_entries" as never)
    .update({
      entry_state: "pending" satisfies GuestEntryState,
      checked_in_at: null,
      checked_in_by: null,
    } as never)
    .eq("id", entryId)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  if (listId) revalidatePath(`/studio/marketplace/box-office/${listId}`);
  return { ok: true };
}

// ── door scan (resolve a code -> classify -> check in) ──────────────
// Reuses the scanAssignment shape conceptually: resolve scan_code to an
// entry, classify the outcome, and on `accepted` flip pending -> arrived.
export type ScanState = { result?: GuestScanResult; guestName?: string; error?: string } | null;

const ScanSchema = z.object({
  guest_list_id: z.string().uuid(),
  scan_code: z.string().min(1).max(120),
});

export async function scanGuestCodeAction(_: ScanState, fd: FormData): Promise<ScanState> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can work the door" };
  const parsed = ScanSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Enter a scan code" };
  const supabase = await createClient();

  const code = parsed.data.scan_code.trim();
  const { data: entry, error } = await supabase
    .from("guest_list_entries" as never)
    .select("id, guest_name, entry_state")
    .eq("org_id", session.orgId)
    .eq("guest_list_id", parsed.data.guest_list_id)
    .eq("scan_code", code)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) return { error: error.message };

  const row = entry as { id: string; guest_name: string; entry_state: GuestEntryState } | null;
  const result = classifyScan(row);

  if (result === "accepted" && row) {
    const { error: upErr } = await supabase
      .from("guest_list_entries" as never)
      .update({
        entry_state: "arrived" satisfies GuestEntryState,
        checked_in_at: new Date().toISOString(),
        checked_in_by: session.userId,
      } as never)
      .eq("id", row.id)
      .eq("org_id", session.orgId)
      .eq("entry_state", "pending");
    if (upErr) return { error: upErr.message };
  }

  revalidatePath(`/studio/marketplace/box-office/${parsed.data.guest_list_id}`);
  return { result, guestName: row?.guest_name };
}
