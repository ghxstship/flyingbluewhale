import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
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
  const { t } = await getRequestT();
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
  const transmittal = row as unknown as Transmittal;

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
        eyebrow={`${t("console.transmittals.detail.eyebrow", undefined, "Transmittals")} · ${transmittal.project?.name ?? t("console.transmittals.detail.projectFallback", undefined, "Project")}`}
        title={`${transmittal.code} — ${transmittal.subject}`}
        subtitle={`${recipients.length} ${recipients.length === 1 ? t("console.transmittals.detail.recipientSingular", undefined, "recipient") : t("console.transmittals.detail.recipientPlural", undefined, "recipients")} · ${ackCount} ${t("console.transmittals.detail.acknowledged", undefined, "acknowledged")} · ${items.length} ${items.length === 1 ? t("console.transmittals.detail.itemSingular", undefined, "item") : t("console.transmittals.detail.itemPlural", undefined, "items")}`}
        action={
          <Button href="/console/transmittals" size="sm" variant="ghost">
            {t("console.transmittals.detail.allTransmittals", undefined, "← All Transmittals")}
          </Button>
        }
      />
      <div className="page-content space-y-6">
        <div className="surface flex flex-wrap items-center gap-3 p-3 text-xs">
          <Badge variant={STATE_TONE[transmittal.transmittal_state]}>{toTitle(transmittal.transmittal_state)}</Badge>
          {transmittal.sent_at && (
            <span className="font-mono text-[var(--text-muted)]">
              {t("console.transmittals.detail.sent", undefined, "Sent")} ·{" "}
              {fmt.dateParts(transmittal.sent_at, { year: "numeric", month: "short", day: "numeric" })}
            </span>
          )}
          {transmittal.due_at && (
            <span className="font-mono text-[var(--text-muted)]">
              {t("console.transmittals.detail.due", undefined, "Due")} ·{" "}
              {fmt.dateParts(transmittal.due_at, { year: "numeric", month: "short", day: "numeric" })}
            </span>
          )}
          <span className="ms-auto flex gap-2">
            {transmittal.transmittal_state === "draft" && recipients.length > 0 && (
              <form action={sendTransmittal}>
                <input type="hidden" name="transmittal_id" value={transmittal.id} />
                <Button type="submit" size="sm">
                  {t("console.transmittals.detail.send", undefined, "Send")}
                </Button>
              </form>
            )}
            {transmittal.transmittal_state === "sent" && (
              <form action={closeTransmittal}>
                <input type="hidden" name="transmittal_id" value={transmittal.id} />
                <Button type="submit" size="sm" variant="ghost">
                  {t("console.transmittals.detail.markClosed", undefined, "Mark Closed")}
                </Button>
              </form>
            )}
          </span>
        </div>

        {transmittal.body_md && (
          <section className="surface space-y-2 p-4">
            <h2 className="text-sm font-semibold">{t("console.transmittals.detail.body", undefined, "Body")}</h2>
            <pre className="font-mono text-xs whitespace-pre-wrap text-[var(--text-secondary)]">
              {transmittal.body_md}
            </pre>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">
            {t("console.transmittals.detail.itemsHeading", undefined, "Items")} ({items.length})
          </h2>
          {items.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)]">
              {t(
                "console.transmittals.detail.noItems",
                undefined,
                "No items yet. Add drawings, specs, RFIs, or files to dispatch.",
              )}
            </p>
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
          {transmittal.transmittal_state === "draft" && (
            <form
              action={addItem}
              className="surface grid grid-cols-[120px_1fr_2fr_auto] items-center gap-2 p-3 text-xs"
            >
              <input type="hidden" name="transmittal_id" value={transmittal.id} />
              <select name="item_type" required className={`${INPUT} text-xs`}>
                <option value="site_plan">
                  {t("console.transmittals.detail.itemType.sitePlan", undefined, "Site Plan")}
                </option>
                <option value="sheet_set_version">
                  {t("console.transmittals.detail.itemType.sheetSetVersion", undefined, "Sheet Set Version")}
                </option>
                <option value="spec_section">
                  {t("console.transmittals.detail.itemType.specSection", undefined, "Spec Section")}
                </option>
                <option value="submittal">
                  {t("console.transmittals.detail.itemType.submittal", undefined, "Submittal")}
                </option>
                <option value="rfi">{t("console.transmittals.detail.itemType.rfi", undefined, "RFI")}</option>
                <option value="deliverable">
                  {t("console.transmittals.detail.itemType.deliverable", undefined, "Deliverable")}
                </option>
                <option value="file">{t("console.transmittals.detail.itemType.file", undefined, "File")}</option>
              </select>
              <input
                name="item_id"
                required
                placeholder={t("console.transmittals.detail.uuidPlaceholder", undefined, "UUID")}
                className={`${INPUT} font-mono text-xs`}
              />
              <input
                name="description"
                placeholder={t(
                  "console.transmittals.detail.descriptionPlaceholder",
                  undefined,
                  "Description · Optional",
                )}
                className={`${INPUT} text-xs`}
              />
              <Button type="submit" size="sm" variant="secondary">
                {t("console.transmittals.detail.addItem", undefined, "+ Add Item")}
              </Button>
            </form>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">
            {t("console.transmittals.detail.recipientsHeading", undefined, "Recipients")} ({recipients.length})
          </h2>
          {recipients.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)]">
              {t(
                "console.transmittals.detail.noRecipients",
                undefined,
                "No recipients yet. Add at least one to enable Send.",
              )}
            </p>
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
                    {r.cc && (
                      <span className="text-[var(--text-muted)]">
                        {t("console.transmittals.detail.cc", undefined, "CC")}
                      </span>
                    )}
                    <span className="ms-auto flex items-center gap-2">
                      {acked ? (
                        <Badge variant="success">
                          {t("console.transmittals.detail.acknowledgedBadge", undefined, "Acknowledged")} ·{" "}
                          {fmt.dateParts(acked.acknowledged_at, { month: "short", day: "numeric" })}
                        </Badge>
                      ) : r.delivered_at ? (
                        <Badge variant="info">
                          {t("console.transmittals.detail.delivered", undefined, "Delivered")}
                        </Badge>
                      ) : (
                        <Badge variant="muted">{t("console.transmittals.detail.pending", undefined, "Pending")}</Badge>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          {transmittal.transmittal_state === "draft" && (
            <form
              action={addRecipient}
              className="surface grid grid-cols-[120px_1fr_auto_auto] items-center gap-2 p-3 text-xs"
            >
              <input type="hidden" name="transmittal_id" value={transmittal.id} />
              <select name="recipient_kind" className={`${INPUT} text-xs`} required>
                <option value="user">
                  {t("console.transmittals.detail.recipientKind.user", undefined, "Org User")}
                </option>
                <option value="vendor">
                  {t("console.transmittals.detail.recipientKind.vendor", undefined, "Vendor")}
                </option>
                <option value="external_email">
                  {t("console.transmittals.detail.recipientKind.externalEmail", undefined, "External Email")}
                </option>
              </select>
              <span className="grid grid-cols-3 gap-2">
                <select name="user_id" className={`${INPUT} text-xs`}>
                  <option value="">{t("console.transmittals.detail.userOption", undefined, "— user —")}</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name ?? u.email ?? u.id}
                    </option>
                  ))}
                </select>
                <select name="vendor_id" className={`${INPUT} text-xs`}>
                  <option value="">{t("console.transmittals.detail.vendorOption", undefined, "— vendor —")}</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <input
                  type="email"
                  name="external_email"
                  placeholder={t("console.transmittals.detail.emailPlaceholder", undefined, "email@…")}
                  className={`${INPUT} text-xs`}
                />
              </span>
              <label className="flex items-center gap-1">
                <input type="checkbox" name="cc" value="1" /> {t("console.transmittals.detail.cc", undefined, "CC")}
              </label>
              <Button type="submit" size="sm" variant="secondary">
                {t("console.transmittals.detail.add", undefined, "+ Add")}
              </Button>
            </form>
          )}
        </section>
      </div>
    </>
  );
}
