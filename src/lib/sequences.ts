import "server-only";
import { createServiceClient } from "@/lib/supabase/server";

// The `next_sequence` / `peek_sequence` RPCs are added by migration
// `20260504000011_auto_number_sequences.sql`. Until the remote DB is migrated
// and `database.types.ts` is regenerated, the generated `Functions` union
// won't include these names — cast to the loose RPC shape so we typecheck
// against the actual SQL signatures we ship.
type SequenceRpc = {
  rpc(
    fn: "next_sequence",
    args: { p_org_id: string; p_scope: string; p_format: string | null },
  ): Promise<{ data: string | null; error: { message: string } | null }>;
  rpc(
    fn: "peek_sequence",
    args: { p_org_id: string; p_scope: string },
  ): Promise<{
    data: { current_val: number; format: string }[] | { current_val: number; format: string } | null;
    error: { message: string } | null;
  }>;
};

/**
 * Format string for an auto-number sequence. Token grammar (matches the
 * `next_sequence` SQL function in `20260504000011_auto_number_sequences.sql`):
 *
 *   {seq}      zero-padded sequence (default width 4)
 *   {seq:N}    zero-padded sequence to N width (e.g. `{seq:6}` -> "000042")
 *   {YYYY}     UTC year, 4 digits
 *   {YY}       UTC year, last 2 digits
 *   {MM}       UTC month, zero-padded
 *   {DD}       UTC day, zero-padded
 *   {ORG}      uppercased `orgs.slug` (or "ORG" if unresolved)
 *
 * Anything outside these tokens is treated as a literal — for example
 * `"INV-{YYYY}-{seq:04}"` resolves to `"INV-2026-0017"`.
 */
export type SequenceFormat = string;

/**
 * Atomically advance a per-org/per-scope counter and return the formatted
 * identifier. Wraps the `next_sequence` SQL function — uses the service
 * client because the function is `security definer` and gates internally on
 * `is_org_member()`.
 */
export async function nextSequence(opts: { orgId: string; scope: string; format?: SequenceFormat }): Promise<string> {
  const supabase = createServiceClient() as unknown as SequenceRpc;
  const { data, error } = await supabase.rpc("next_sequence", {
    p_org_id: opts.orgId,
    p_scope: opts.scope,
    p_format: opts.format ?? null,
  });
  if (error) throw error;
  return data as string;
}

/**
 * Read-only inspection of an existing counter without advancing it. Returns
 * `null` when the sequence has not been initialized yet.
 */
export async function peekSequence(opts: {
  orgId: string;
  scope: string;
}): Promise<{ current_val: number; format: string } | null> {
  const supabase = createServiceClient() as unknown as SequenceRpc;
  const { data, error } = await supabase.rpc("peek_sequence", {
    p_org_id: opts.orgId,
    p_scope: opts.scope,
  });
  if (error) throw error;
  // Postgres set-returning functions come back as an array of rows.
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return row;
}

/**
 * Pure JS preview of how a format string would resolve for a given seq/date.
 * Safe to call from client components — no DB access. Used by editors that
 * want to show "next: INV-2026-0018" before committing.
 */
export function formatSequencePreview(format: string, opts: { seq: number; orgSlug?: string; date?: Date }): string {
  const d = opts.date ?? new Date();
  const yyyy = String(d.getUTCFullYear());
  const yy = yyyy.slice(-2);
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const slug = (opts.orgSlug ?? "ORG").toUpperCase();

  let out = format
    .replaceAll("{YYYY}", yyyy)
    .replaceAll("{YY}", yy)
    .replaceAll("{MM}", mm)
    .replaceAll("{DD}", dd)
    .replaceAll("{ORG}", slug);

  out = out.replace(/\{seq:(\d+)\}/g, (_, w: string) => String(opts.seq).padStart(parseInt(w, 10), "0"));
  out = out.replaceAll("{seq}", String(opts.seq).padStart(4, "0"));

  return out;
}
