import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { sendTransmittal, closeTransmittal, addRecipient, addItem } from "./actions";

export const dynamic = "force-dynamic";

type TransmittalState = "draft" | "sent" | "acknowledged" | "closed" | "voided";
type RecipientKind = "user" | "vendor" | "external_email";
type ItemType = "site_plan" | "sheet_set_version" | "spec_section" | "submittal" | "rfi" | "deliverable" | "file";

type Transmittal = {
  id: string;
  code: string;
  subject: string;
  body_md: string | null;
  transmittal_state: TransmittalState;
  due_at: string | null;
  sent_at: string | null;
  closed_at: string | null;
  project_id: string;
  project: { id: string; name: string | null } | null;
};

type Recipient = {
  id: string;
  recipient_kind: RecipientKind;
  external_email: string | null;
  cc: boolean;
  delivered_at: string | null;
  user: { id: string; name: string | null; email: string | null } | null;
  vendor: { id: string; name: string | null } | null;
  ack: { id: string; acknowledged_at: string }[] | null;
};

type Item = {
  id: string;
  item_type: ItemType;
  item_id: string;
  description: string | null;
  ordinal: number;
};

const STATE_TONE: Record<TransmittalState, "muted" | "info" | "warning" | "success" | "error"> = {
  draft: "muted",
  sent: "info",
  acknowledged: "success",
  closed: "muted",
  voided: "error",
};

const INPUT = "w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();
  const { id } = await params;

  const { data: row } = await supabase
    .from("transmittals")
    .select(
      "id, code, subject, body_md, transmittal_state, due_at, sent_at, closed_at, project_id, project:project_id(id, name)",
    )
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!row) notFound();
  const t = row as unknown as Transmittal;

  const [{ data: recipientData }, { data: itemData }, { data: orgUsers }, { data: orgVendors }] = await Promise.all([
    supabase
      .from("transmittal_recipients")
      .select(
        "id, recipient_kind, external_email, cc, delivered_at, user:user_id(id, name, email), vendor:vendor_id(id, name), ack:transmittal_acknowledgements!recipient_id(id, acknowledged_at)",
      )
      .eq("transmittal_id", id)
      .eq("org_id", session.orgId)
      .order("created_at", { ascending: true }),
    supabase
      .from("transmittal_items")
      .select("id, item_type, item_id, description, ordinal")
      .eq("transmittal_id", id)
      .eq("org_id", session.orgId)
      .order("ordinal", { ascending: true }),
    supabase.from("users").select("id, name, email").limit(200),
    supabase
      .from("vendors")
      .select("id, name")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("name")
      .limit(200),
  ]);

  const recipients = (recipientData ?? []) as unknown as Recipient[];
  const items = (itemData ?? []) as unknown as Item[];
  const users = (orgUsers ?? []) as Array<{ id: string; name: string | null; email: string | null }>;
  const vendors = (orgVendors ?? []) as Array<{ id: string; name: string }>;

  const ackCount = recipients.filter((r) => (r.ack ?? []).length > 0).length;

  return (
    <>
      <ModuleHeader
        eyebrow={`Transmittals · ${t.project?.name ?? "Project"}`}
        title={`${t.code} — ${t.subject}`}
        subtitle={`${recipients.length} recipient${recipients.length === 1 ? "" : "s"} · ${ackCount} acknowledged · ${items.length} item${items.length === 1 ? "" : "s"}`}
        action={
          <Button href="/console/transmittals" size="sm" variant="ghost">
            ← All Transmittals
          </Button>
        }
      />
      <div className="page-content space-y-6">
        <div className="surface flex flex-wrap items-center gap-3 p-3 text-xs">
          <Badge variant={STATE_TONE[t.transmittal_state]}>{toTitle(t.transmittal_state)}</Badge>
          {t.sent_at && (
            <span className="font-mono text-[var(--text-muted)]">
              Sent · {fmt.dateParts(t.sent_at, { year: "numeric", month: "short", day: "numeric" })}
            </span>
          )}
          {t.due_at && (
            <span className="font-mono text-[var(--text-muted)]">
              Due · {fmt.dateParts(t.due_at, { year: "numeric", month: "short", day: "numeric" })}
            </span>
          )}
          <span className="ms-auto flex gap-2">
            {t.transmittal_state === "draft" && recipients.length > 0 && (
              <form action={sendTransmittal}>
                <input type="hidden" name="transmittal_id" value={t.id} />
                <Button type="submit" size="sm">
                  Send
                </Button>
              </form>
            )}
            {t.transmittal_state === "sent" && (
              <form action={closeTransmittal}>
                <input type="hidden" name="transmittal_id" value={t.id} />
                <Button type="submit" size="sm" variant="ghost">
                  Mark Closed
                </Button>
              </form>
            )}
          </span>
        </div>

        {t.body_md && (
          <section className="surface space-y-2 p-4">
            <h2 className="text-sm font-semibold">Body</h2>
            <pre className="font-mono text-xs whitespace-pre-wrap text-[var(--text-secondary)]">{t.body_md}</pre>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Items ({items.length})</h2>
          {items.length === 0 ? (
            <EmptyState size="compact" title="No items yet" description="Add drawings, specs, RFIs, or files to dispatch." />
          ) : (
            <ul className="space-y-1">
              {items.map((it) => (
                <li key={it.id} className="surface flex items-center gap-3 p-2 text-xs">
                  <span className="font-mono text-[var(--text-muted)] uppercase">
                    {it.item_type.replace(/_/g, " ")}
                  </span>
                  <span className="font-mono">{it.item_id.slice(0, 8)}…</span>
                  {it.description && <span className="text-[var(--text-secondary)]">{it.description}</span>}
                </li>
              ))}
            </ul>
          )}
          {t.transmittal_state === "draft" && (
            <form
              action={addItem}
              className="surface grid grid-cols-[120px_1fr_2fr_auto] items-center gap-2 p-3 text-xs"
            >
              <input type="hidden" name="transmittal_id" value={t.id} />
              <select name="item_type" required className={`${INPUT} text-xs`}>
                <option value="site_plan">Site Plan</option>
                <option value="sheet_set_version">Sheet Set Version</option>
                <option value="spec_section">Spec Section</option>
                <option value="submittal">Submittal</option>
                <option value="rfi">RFI</option>
                <option value="deliverable">Deliverable</option>
                <option value="file">File</option>
              </select>
              <input name="item_id" required placeholder="UUID" className={`${INPUT} font-mono text-xs`} />
              <input name="description" placeholder="Description (optional)" className={`${INPUT} text-xs`} />
              <Button type="submit" size="sm" variant="secondary">
                + Add Item
              </Button>
            </form>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Recipients ({recipients.length})</h2>
          {recipients.length === 0 ? (
            <EmptyState size="compact" title="No recipients yet" description="Add at least one to enable Send." />
          ) : (
            <ul className="space-y-1">
              {recipients.map((r) => {
                const acked = (r.ack ?? [])[0];
                const label =
                  r.recipient_kind === "user"
                    ? (r.user?.name ?? r.user?.email ?? "—")
                    : r.recipient_kind === "vendor"
                      ? (r.vendor?.name ?? "—")
                      : (r.external_email ?? "—");
                return (
                  <li key={r.id} className="surface flex items-center gap-3 p-2 text-xs">
                    <span className="font-mono text-[var(--text-muted)] uppercase">{r.recipient_kind}</span>
                    <span>{label}</span>
                    {r.cc && <span className="text-[var(--text-muted)]">CC</span>}
                    <span className="ms-auto flex items-center gap-2">
                      {acked ? (
                        <Badge variant="success">
                          Acknowledged · {fmt.dateParts(acked.acknowledged_at, { month: "short", day: "numeric" })}
                        </Badge>
                      ) : r.delivered_at ? (
                        <Badge variant="info">Delivered</Badge>
                      ) : (
                        <Badge variant="muted">Pending</Badge>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          {t.transmittal_state === "draft" && (
            <form
              action={addRecipient}
              className="surface grid grid-cols-[120px_1fr_auto_auto] items-center gap-2 p-3 text-xs"
            >
              <input type="hidden" name="transmittal_id" value={t.id} />
              <select name="recipient_kind" className={`${INPUT} text-xs`} required>
                <option value="user">Org User</option>
                <option value="vendor">Vendor</option>
                <option value="external_email">External Email</option>
              </select>
              <span className="grid grid-cols-3 gap-2">
                <select name="user_id" className={`${INPUT} text-xs`}>
                  <option value="">— user —</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name ?? u.email ?? u.id}
                    </option>
                  ))}
                </select>
                <select name="vendor_id" className={`${INPUT} text-xs`}>
                  <option value="">— vendor —</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <input type="email" name="external_email" placeholder="email@…" className={`${INPUT} text-xs`} />
              </span>
              <label className="flex items-center gap-1">
                <input type="checkbox" name="cc" value="1" /> CC
              </label>
              <Button type="submit" size="sm" variant="secondary">
                + Add
              </Button>
            </form>
          )}
        </section>
      </div>
    </>
  );
}
