import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Record-ref chips (kit 20 Inbox M-series) — record identifiers mentioned in
 * chat render as chips that deep-link to the record, so a thread like
 * "INV-2026-014 is ready to send" is one click from the invoice.
 *
 * Two ref sources, both deterministic:
 * 1. Pasted internal links (`/studio/...` paths, with or without origin) —
 *    zero lookup, the path IS the destination.
 * 2. Document codes that exist as real columns: `invoices.number`,
 *    `proposals.doc_number`, `rfis.code`. Candidates are pattern-scanned
 *    from the loaded messages and resolved org-scoped in one batched query
 *    per table — unmatched tokens stay plain text (never a fabricated link).
 */

import { CHAT_URL_PATTERN, type RecordRefMap } from "./record-ref-types";

export type { RecordRef, RecordRefMap } from "./record-ref-types";

/** Document-code tokens worth resolving (INV/PRO(P)/RFI prefixes). */
const DOC_CODE_PATTERN = /\b(?:INV|PROP?|RFI)-[A-Za-z0-9][\w-]*\b/g;

function pathOf(url: string): string {
  const idx = url.indexOf("/studio/");
  return idx >= 0 ? url.slice(idx) : url;
}

function labelForPath(path: string): string {
  const clean = path.split(/[?#]/)[0] ?? path;
  const segs = clean.split("/").filter(Boolean);
  // "/studio/finance/invoices/<uuid>" → "Invoices"; keep it short and human.
  const noun = segs.filter((s) => !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(s)).pop() ?? "record";
  return noun
    .split("-")
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/**
 * Scan message bodies and resolve every ref in one pass. Loose client cast
 * mirrors the callers — the three lookups are simple org-scoped selects.
 */
export async function resolveRecordRefs(
  supabase: SupabaseClient,
  orgId: string,
  bodies: string[],
): Promise<RecordRefMap> {
  const refs: RecordRefMap = {};
  const codes = new Set<string>();

  for (const body of bodies) {
    for (const m of body.matchAll(CHAT_URL_PATTERN)) {
      const token = m[0];
      const path = pathOf(token);
      refs[token] = { href: path, label: labelForPath(path) };
    }
    for (const m of body.matchAll(DOC_CODE_PATTERN)) codes.add(m[0]);
  }
  if (codes.size === 0) return refs;

  const tokens = [...codes];
  const [invoices, proposals, rfis] = await Promise.all([
    supabase.from("invoices").select("id, number").eq("org_id", orgId).in("number", tokens),
    supabase.from("proposals").select("id, doc_number").eq("org_id", orgId).in("doc_number", tokens),
    supabase.from("rfis").select("id, code").eq("org_id", orgId).in("code", tokens),
  ]);
  for (const r of (invoices.data ?? []) as Array<{ id: string; number: string | null }>) {
    if (r.number) refs[r.number] = { href: `/studio/finance/invoices/${r.id}`, label: r.number };
  }
  for (const r of (proposals.data ?? []) as Array<{ id: string; doc_number: string | null }>) {
    if (r.doc_number) refs[r.doc_number] = { href: `/studio/proposals/${r.id}`, label: r.doc_number };
  }
  for (const r of (rfis.data ?? []) as Array<{ id: string; code: string | null }>) {
    if (r.code) refs[r.code] = { href: `/studio/rfis/${r.id}`, label: r.code };
  }
  return refs;
}
