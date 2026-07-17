import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { formatDate } from "@/lib/i18n/format";
import {
  contractBillingLabel,
  contractKindLabel,
  formatMinor,
  listMilestones,
  listObligations,
  listParties,
  listSignatures,
  listTerms,
  listVersions,
  type ContractRow,
  type ContractVersionRow,
} from "@/lib/clm/queries";
import { addMilestone, addObligation, addParty, addTerm, addVersion, recordSignature } from "./actions";

export const dynamic = "force-dynamic";

function fmtDate(s: string | null): string {
  return s ? formatDate(new Date(s)) : "—";
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="page-content">
        {t("console.legal.contracts.detail.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  const { id } = await params;
  const session = await requireSession();
  const contract = (await getOrgScoped("contracts", session.orgId, id)) as unknown as ContractRow | null;
  if (!contract) notFound();

  const supabase = await createClient();
  const [members, milestones, obligations, parties, terms, signatures, versions] = await Promise.all([
    supabase
      .from("memberships")
      .select("user_id, users:users!inner(id, email, name)")
      .eq("org_id", session.orgId)
      .is("deleted_at", null),
    listMilestones(id),
    listObligations(id),
    listParties(id),
    listTerms(id),
    listSignatures(id),
    listVersions(id),
  ]);

  // party_id / signer_party_id hold parties.id — resolve display names from
  // the party layer (org-scoped; archived parties still resolve for history).
  const partyIds = [...new Set([...parties.map((p) => p.party_id), ...signatures.map((s) => s.signer_party_id)])];
  const partyRows =
    partyIds.length === 0
      ? []
      : // soft-delete-exempt: name-resolution for historical rows — an archived
        // party still signed what it signed.
        ((await supabase.from("parties").select("id, display_name").eq("org_id", session.orgId).in("id", partyIds))
          .data ?? []);
  const partyName = (pid: string) => partyRows.find((p) => p.id === pid)?.display_name ?? pid.slice(0, 8);

  const memberList = (
    (members.data ?? []) as unknown as Array<{
      user_id: string;
      users: { id: string; email: string; name: string | null } | null;
    }>
  )
    .map((m) => m.users)
    .filter((u): u is { id: string; email: string; name: string | null } => !!u)
    .sort((a, b) => (a.name ?? a.email).localeCompare(b.name ?? b.email));
  const versionLabel = (vid: string) => {
    const v = versions.find((x) => x.id === vid);
    return v ? `v${v.version}` : "—";
  };

  const cid = contract.id;
  const sectionCardClass = "surface space-y-3 p-5";
  const tableClass = "ps-table w-full text-sm";

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legal.contracts.detail.eyebrow", undefined, "Contract")}
        title={contract.title}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant="muted">{contractKindLabel(contract.kind)}</Badge>
            <StatusBadge status={contract.state} />
            <span className="font-mono text-xs">{contract.number}</span>
          </span>
        }
      />
      <div className="page-content max-w-4xl space-y-4">
        {/* Header facts */}
        <section className="surface grid grid-cols-2 gap-3 p-4 text-xs sm:grid-cols-4">
          <Fact label={t("console.legal.contracts.detail.value", undefined, "Value")}>
            <span className="font-mono">{formatMinor(contract.total_value_minor, contract.total_value_currency)}</span>
          </Fact>
          <Fact label={t("console.legal.contracts.detail.billing", undefined, "Billing")}>
            {contract.billing_method ? contractBillingLabel(contract.billing_method) : "—"}
          </Fact>
          <Fact label={t("console.legal.contracts.detail.start", undefined, "Start")}>
            <span className="font-mono">{fmtDate(contract.start_at)}</span>
          </Fact>
          <Fact label={t("console.legal.contracts.detail.end", undefined, "End")}>
            <span className="font-mono">{fmtDate(contract.end_at)}</span>
          </Fact>
          <Fact label={t("console.legal.contracts.detail.counterparty", undefined, "Counterparty")}>
            {contract.counterparty_name ?? "—"}
          </Fact>
          <Fact label={t("console.legal.contracts.detail.counterpartyEmail", undefined, "Email")}>
            {contract.counterparty_email ?? "—"}
          </Fact>
          <Fact label={t("console.legal.contracts.detail.autoRenew", undefined, "Auto-renew")}>
            {contract.auto_renew
              ? t("console.legal.contracts.detail.yes", undefined, "Yes")
              : t("console.legal.contracts.detail.no", undefined, "No")}
          </Fact>
        </section>

        {contract.notes && <section className="surface p-4 text-sm whitespace-pre-wrap">{contract.notes}</section>}

        {/* Milestones */}
        <Card className={sectionCardClass}>
          <SectionTitle>{t("console.legal.contracts.detail.milestones", undefined, "Milestones")}</SectionTitle>
          {milestones.length === 0 ? (
            <EmptyState
              size="compact"
              title={t("console.legal.contracts.detail.milestonesEmpty", undefined, "No milestones")}
            />
          ) : (
            <table className={tableClass}>
              <thead>
                <tr>
                  <th>{t("console.legal.contracts.detail.col.label", undefined, "Label")}</th>
                  <th>{t("console.legal.contracts.detail.col.trigger", undefined, "Trigger")}</th>
                  <th>{t("console.legal.contracts.detail.col.due", undefined, "Due")}</th>
                  <th>{t("console.legal.contracts.detail.col.payment", undefined, "Payment")}</th>
                  <th>{t("console.legal.contracts.detail.col.state", undefined, "State")}</th>
                </tr>
              </thead>
              <tbody>
                {milestones.map((m) => (
                  <tr key={m.id}>
                    <td>{m.label}</td>
                    <td className="font-mono text-xs">{m.trigger_kind}</td>
                    <td className="font-mono text-xs">{fmtDate(m.due_at)}</td>
                    <td className="font-mono text-xs">{formatMinor(m.payment_amount_minor, m.payment_currency)}</td>
                    <td>
                      <StatusBadge status={m.state} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <FormShell
            action={addMilestone}
            dirtyGuard={false}
            className="grid grid-cols-2 gap-3"
            submitLabel={t("common.add", undefined, "Add")}
          >
            <input type="hidden" name="contract_id" value={cid} />
            <Input
              label={t("console.legal.contracts.detail.col.label", undefined, "Label")}
              name="label"
              required
              maxLength={200}
            />
            <Input
              label={t("console.legal.contracts.detail.col.trigger", undefined, "Trigger kind")}
              name="trigger_kind"
              required
              maxLength={80}
              placeholder="on_signature"
            />
            <Input label={t("console.legal.contracts.detail.col.due", undefined, "Due")} name="due_at" type="date" />
            <Input
              label={t("console.legal.contracts.detail.col.paymentUsd", undefined, "Payment (USD)")}
              name="payment_usd"
              type="number"
              step="0.01"
              min="0"
            />
          </FormShell>
        </Card>

        {/* Obligations */}
        <Card className={sectionCardClass}>
          <SectionTitle>{t("console.legal.contracts.detail.obligations", undefined, "Obligations")}</SectionTitle>
          {obligations.length === 0 ? (
            <EmptyState
              size="compact"
              title={t("console.legal.contracts.detail.obligationsEmpty", undefined, "No obligations")}
            />
          ) : (
            <table className={tableClass}>
              <thead>
                <tr>
                  <th>{t("console.legal.contracts.detail.col.kind", undefined, "Kind")}</th>
                  <th>{t("console.legal.contracts.detail.col.description", undefined, "Description")}</th>
                  <th>{t("console.legal.contracts.detail.col.recurring", undefined, "Recurring")}</th>
                  <th>{t("console.legal.contracts.detail.col.due", undefined, "Due")}</th>
                  <th>{t("console.legal.contracts.detail.col.state", undefined, "State")}</th>
                </tr>
              </thead>
              <tbody>
                {obligations.map((o) => (
                  <tr key={o.id}>
                    <td className="font-mono text-xs">{o.ob_kind}</td>
                    <td>{o.description}</td>
                    <td>{o.recurring ? "✓" : "—"}</td>
                    <td className="font-mono text-xs">{fmtDate(o.due_at)}</td>
                    <td>
                      <StatusBadge status={o.state} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <FormShell
            action={addObligation}
            dirtyGuard={false}
            className="grid grid-cols-2 gap-3"
            submitLabel={t("common.add", undefined, "Add")}
          >
            <input type="hidden" name="contract_id" value={cid} />
            <Input
              label={t("console.legal.contracts.detail.col.kind", undefined, "Obligation kind")}
              name="ob_kind"
              required
              maxLength={80}
              placeholder="reporting"
            />
            <Input label={t("console.legal.contracts.detail.col.due", undefined, "Due")} name="due_at" type="date" />
            <div className="col-span-2">
              <label className="text-xs font-medium text-[var(--p-text-2)]">
                {t("console.legal.contracts.detail.col.description", undefined, "Description")}
              </label>
              <textarea name="description" rows={2} required maxLength={1000} className="ps-input mt-1.5 w-full" />
            </div>
            <label className="col-span-2 flex items-center gap-2 text-sm">
              <input type="checkbox" name="recurring" className="size-4" />
              {t("console.legal.contracts.detail.recurringLabel", undefined, "Recurring obligation")}
            </label>
          </FormShell>
        </Card>

        {/* Parties */}
        <Card className={sectionCardClass}>
          <SectionTitle>{t("console.legal.contracts.detail.parties", undefined, "Parties")}</SectionTitle>
          {parties.length === 0 ? (
            <EmptyState
              size="compact"
              title={t("console.legal.contracts.detail.partiesEmpty", undefined, "No parties")}
            />
          ) : (
            <table className={tableClass}>
              <thead>
                <tr>
                  <th>{t("console.legal.contracts.detail.col.party", undefined, "Party")}</th>
                  <th>{t("console.legal.contracts.detail.col.role", undefined, "Role")}</th>
                  <th>{t("console.legal.contracts.detail.col.capacity", undefined, "Signing capacity")}</th>
                </tr>
              </thead>
              <tbody>
                {parties.map((p) => (
                  <tr key={p.id}>
                    <td>{partyName(p.party_id)}</td>
                    <td>{p.role}</td>
                    <td>{p.signing_capacity ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <FormShell
            action={addParty}
            dirtyGuard={false}
            className="grid grid-cols-3 gap-3"
            submitLabel={t("common.add", undefined, "Add")}
          >
            <input type="hidden" name="contract_id" value={cid} />
            <div>
              <label className="text-xs font-medium text-[var(--p-text-2)]">
                {t("console.legal.contracts.detail.col.party", undefined, "Party")}
              </label>
              <select name="party_user_id" className="ps-input mt-1.5 w-full" defaultValue="">
                <option value="">
                  {t("console.legal.contracts.detail.partySelf", undefined, "Me (current user)")}
                </option>
                {memberList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name ?? m.email}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label={t("console.legal.contracts.detail.col.role", undefined, "Role")}
              name="role"
              required
              maxLength={80}
              placeholder="signatory"
            />
            <Input
              label={t("console.legal.contracts.detail.col.capacity", undefined, "Signing capacity")}
              name="signing_capacity"
              maxLength={120}
              placeholder="Authorized officer"
            />
          </FormShell>
        </Card>

        {/* Terms */}
        <Card className={sectionCardClass}>
          <SectionTitle>{t("console.legal.contracts.detail.terms", undefined, "Terms")}</SectionTitle>
          {terms.length === 0 ? (
            <EmptyState size="compact" title={t("console.legal.contracts.detail.termsEmpty", undefined, "No terms")} />
          ) : (
            <table className={tableClass}>
              <thead>
                <tr>
                  <th>{t("console.legal.contracts.detail.col.kind", undefined, "Kind")}</th>
                  <th>{t("console.legal.contracts.detail.col.description", undefined, "Description")}</th>
                  <th>{t("console.legal.contracts.detail.col.active", undefined, "Active")}</th>
                </tr>
              </thead>
              <tbody>
                {terms.map((tm) => (
                  <tr key={tm.id}>
                    <td className="font-mono text-xs">{tm.term_kind}</td>
                    <td>{tm.description}</td>
                    <td>{tm.active ? "✓" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <FormShell
            action={addTerm}
            dirtyGuard={false}
            className="grid grid-cols-2 gap-3"
            submitLabel={t("common.add", undefined, "Add")}
          >
            <input type="hidden" name="contract_id" value={cid} />
            <Input
              label={t("console.legal.contracts.detail.col.kind", undefined, "Term kind")}
              name="term_kind"
              required
              maxLength={80}
              placeholder="exclusivity"
            />
            <div className="col-span-2">
              <label className="text-xs font-medium text-[var(--p-text-2)]">
                {t("console.legal.contracts.detail.col.description", undefined, "Description")}
              </label>
              <textarea name="description" rows={2} required maxLength={1000} className="ps-input mt-1.5 w-full" />
            </div>
          </FormShell>
        </Card>

        {/* Versions */}
        <Card className={sectionCardClass}>
          <SectionTitle>{t("console.legal.contracts.detail.versions", undefined, "Versions")}</SectionTitle>
          {versions.length === 0 ? (
            <EmptyState
              size="compact"
              title={t("console.legal.contracts.detail.versionsEmpty", undefined, "No versions")}
            />
          ) : (
            <table className={tableClass}>
              <thead>
                <tr>
                  <th>{t("console.legal.contracts.detail.col.version", undefined, "Version")}</th>
                  <th>{t("console.legal.contracts.detail.col.redline", undefined, "Redline summary")}</th>
                  <th>{t("console.legal.contracts.detail.col.created", undefined, "Created")}</th>
                </tr>
              </thead>
              <tbody>
                {versions.map((v: ContractVersionRow) => (
                  <tr key={v.id}>
                    <td className="font-mono text-xs">v{v.version}</td>
                    <td>{v.redline_summary ?? "—"}</td>
                    <td className="font-mono text-xs">{fmtDate(v.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <FormShell
            action={addVersion}
            dirtyGuard={false}
            className="space-y-3"
            submitLabel={t("console.legal.contracts.detail.addVersion", undefined, "Add version")}
          >
            <input type="hidden" name="contract_id" value={cid} />
            <div>
              <label className="text-xs font-medium text-[var(--p-text-2)]">
                {t("console.legal.contracts.detail.col.redline", undefined, "Redline summary")}
              </label>
              <textarea name="redline_summary" rows={2} maxLength={2000} className="ps-input mt-1.5 w-full" />
            </div>
          </FormShell>
        </Card>

        {/* Signatures */}
        <Card className={sectionCardClass}>
          <SectionTitle>{t("console.legal.contracts.detail.signatures", undefined, "Signatures")}</SectionTitle>
          {signatures.length === 0 ? (
            <EmptyState
              size="compact"
              title={t("console.legal.contracts.detail.signaturesEmpty", undefined, "No signatures")}
            />
          ) : (
            <table className={tableClass}>
              <thead>
                <tr>
                  <th>{t("console.legal.contracts.detail.col.signer", undefined, "Signer")}</th>
                  <th>{t("console.legal.contracts.detail.col.version", undefined, "Version")}</th>
                  <th>{t("console.legal.contracts.detail.col.signingRole", undefined, "Role")}</th>
                  <th>{t("console.legal.contracts.detail.col.method", undefined, "Method")}</th>
                  <th>{t("console.legal.contracts.detail.col.state", undefined, "State")}</th>
                  <th>{t("console.legal.contracts.detail.col.signedAt", undefined, "Signed")}</th>
                </tr>
              </thead>
              <tbody>
                {signatures.map((s) => (
                  <tr key={s.id}>
                    <td>{partyName(s.signer_party_id)}</td>
                    <td className="font-mono text-xs">{versionLabel(s.version_id)}</td>
                    <td>{s.signing_role}</td>
                    <td className="font-mono text-xs">{s.signature_method}</td>
                    <td>
                      <StatusBadge status={s.state} />
                    </td>
                    <td className="font-mono text-xs">{fmtDate(s.signed_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {versions.length === 0 ? (
            <p className="text-xs text-[var(--p-text-2)]">
              {t(
                "console.legal.contracts.detail.signatureNeedsVersion",
                undefined,
                "Add a version before recording signatures.",
              )}
            </p>
          ) : (
            <FormShell
              action={recordSignature}
              dirtyGuard={false}
              className="grid grid-cols-2 gap-3"
              submitLabel={t("console.legal.contracts.detail.recordSignature", undefined, "Record signature")}
            >
              <input type="hidden" name="contract_id" value={cid} />
              <div>
                <label className="text-xs font-medium text-[var(--p-text-2)]">
                  {t("console.legal.contracts.detail.col.signer", undefined, "Signer")}
                </label>
                <select name="signer_user_id" required className="ps-input mt-1.5 w-full" defaultValue={session.userId}>
                  {memberList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name ?? m.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--p-text-2)]">
                  {t("console.legal.contracts.detail.col.version", undefined, "Version")}
                </label>
                <select name="version_id" required className="ps-input mt-1.5 w-full" defaultValue={versions[0]?.id}>
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      v{v.version}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label={t("console.legal.contracts.detail.col.signingRole", undefined, "Signing role")}
                name="signing_role"
                required
                maxLength={80}
                placeholder="counterparty"
              />
              <div>
                <label className="text-xs font-medium text-[var(--p-text-2)]">
                  {t("console.legal.contracts.detail.col.method", undefined, "Method")}
                </label>
                <select name="signature_method" required className="ps-input mt-1.5 w-full" defaultValue="electronic">
                  <option value="electronic">
                    {t("console.legal.contracts.detail.methodElectronic", undefined, "Electronic")}
                  </option>
                  <option value="wet">{t("console.legal.contracts.detail.methodWet", undefined, "Wet ink")}</option>
                  <option value="docusign">
                    {t("console.legal.contracts.detail.methodDocusign", undefined, "DocuSign")}
                  </option>
                </select>
              </div>
            </FormShell>
          )}
        </Card>
      </div>
    </>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] tracking-wider text-[var(--p-text-2)] uppercase">{label}</div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold text-[var(--p-text-1)]">{children}</h2>;
}
