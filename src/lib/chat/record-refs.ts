import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Shell } from "@/lib/urls";

/**
 * Record-ref chips — SHARED resolver (kit 21 remediation R1, ADR-0015). A
 * record identifier mentioned in chat renders as a chip that deep-links to the
 * record. This is the one resolution SSOT for every shell: it resolves a token
 * to record IDENTITY, then a per-shell mapper turns identity into a
 * destination href (or null when that record has no route in the target
 * shell — the chip then renders unlinked instead of jumping cross-shell).
 *
 * Two ref sources, both deterministic:
 *  1. Pasted internal links (`/studio/...` paths) — the path IS the console
 *     destination; on other shells it has no home, so href is null.
 *  2. Document codes that exist as real columns (`invoices.number`,
 *     `proposals.doc_number`, `rfis.code`), resolved org-scoped in one batched
 *     query per table. Unmatched tokens stay plain text.
 */

const CHAT_URL_PATTERN = /(?:https?:\/\/[^\s]+)?\/studio\/[\w\-/]+(?:\?[\w\-=&%.]*)?/g;
const DOC_CODE_PATTERN = /\b(?:INV|PROP?|RFI)-[A-Za-z0-9][\w-]*\b/g;

/** Resolved record identity — kind + id (or a raw console path for pasted links). */
export type RecordIdentity =
  | { kind: "invoice"; id: string; label: string }
  | { kind: "proposal"; id: string; label: string }
  | { kind: "rfi"; id: string; label: string }
  | { kind: "link"; path: string; label: string };

/** A resolved chip: a shell-mapped href (null = render unlinked) + a label. */
export type RecordRef = { href: string | null; label: string };
export type RecordRefMap = Record<string, RecordRef>;
export type RecordIdentityMap = Record<string, RecordIdentity>;

function pathOf(url: string): string {
  const idx = url.indexOf("/studio/");
  return idx >= 0 ? url.slice(idx) : url;
}

function labelForPath(path: string): string {
  const clean = path.split(/[?#]/)[0] ?? path;
  const segs = clean.split("/").filter(Boolean);
  const noun = segs.filter((s) => !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(s)).pop() ?? "record";
  return noun
    .split("-")
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/**
 * Map a resolved identity to a destination href for one shell (ADR-0015
 * shell-route-map). Returns null when the record has no route in that shell —
 * the chip renders as an unlinked badge rather than jumping cross-shell.
 * Console (`platform`) reaches every kind; the field/portal shells reach only
 * what has a native route (today none of these console records do, so their
 * chips render unlinked — this is the extension point when field-record ref
 * kinds are added).
 */
export function recordHref(shell: Shell, ref: RecordIdentity): string | null {
  if (shell !== "platform") {
    // No field/portal routes for invoice/proposal/rfi/console-link today.
    return null;
  }
  switch (ref.kind) {
    case "invoice":
      return `/studio/finance/invoices/${ref.id}`;
    case "proposal":
      return `/studio/proposals/${ref.id}`;
    case "rfi":
      return `/studio/rfis/${ref.id}`;
    case "link":
      return ref.path;
  }
}

/** Scan bodies and resolve every ref to record identity in one batched pass. */
export async function resolveRecordIdentities(
  supabase: SupabaseClient,
  orgId: string,
  bodies: string[],
): Promise<RecordIdentityMap> {
  const ids: RecordIdentityMap = {};
  const codes = new Set<string>();

  for (const body of bodies) {
    for (const m of body.matchAll(CHAT_URL_PATTERN)) {
      const token = m[0];
      const path = pathOf(token);
      ids[token] = { kind: "link", path, label: labelForPath(path) };
    }
    for (const m of body.matchAll(DOC_CODE_PATTERN)) codes.add(m[0]);
  }
  if (codes.size === 0) return ids;

  const tokens = [...codes];
  const [invoices, proposals, rfis] = await Promise.all([
    supabase.from("invoices").select("id, number").eq("org_id", orgId).in("number", tokens),
    supabase.from("proposals").select("id, doc_number").eq("org_id", orgId).in("doc_number", tokens),
    supabase.from("rfis").select("id, code").eq("org_id", orgId).in("code", tokens),
  ]);
  for (const r of (invoices.data ?? []) as Array<{ id: string; number: string | null }>) {
    if (r.number) ids[r.number] = { kind: "invoice", id: r.id, label: r.number };
  }
  for (const r of (proposals.data ?? []) as Array<{ id: string; doc_number: string | null }>) {
    if (r.doc_number) ids[r.doc_number] = { kind: "proposal", id: r.id, label: r.doc_number };
  }
  for (const r of (rfis.data ?? []) as Array<{ id: string; code: string | null }>) {
    if (r.code) ids[r.code] = { kind: "rfi", id: r.id, label: r.code };
  }
  return ids;
}

/** Resolve + map to shell hrefs in one call — what the chat surfaces consume. */
export async function resolveRecordRefs(
  supabase: SupabaseClient,
  orgId: string,
  bodies: string[],
  shell: Shell,
): Promise<RecordRefMap> {
  const ids = await resolveRecordIdentities(supabase, orgId, bodies);
  const refs: RecordRefMap = {};
  for (const [token, identity] of Object.entries(ids)) {
    refs[token] = { href: recordHref(shell, identity), label: identity.label };
  }
  return refs;
}
