import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { isAdmin as sessionIsAdmin, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";
import { DEPOSIT_PCT_DEFAULT, BALANCE_TERMS_LABEL_DEFAULT } from "@/lib/payment-terms";
import { updateOrgName, updateOrgPaymentDefaults } from "./actions";

export const dynamic = "force-dynamic";

export default async function OrgSettingsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title={t("console.settings.organization.title", undefined, "Organization")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.settings.organization.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const isAdmin = sessionIsAdmin(session);
  const supabase = await createClient();
  const { data: org } = await supabase.from("orgs").select("*").eq("id", session.orgId).maybeSingle();
  if (!org)
    return (
      <>
        <ModuleHeader title={t("console.settings.organization.title", undefined, "Organization")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.settings.organization.notFound", undefined, "Organization not found.")}
          </div>
        </div>
      </>
    );

  const [{ count: members }, { count: invites }, { count: projects }] = await Promise.all([
    supabase
      .from("memberships")
      .select("*", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .is("deleted_at", null),
    supabase
      .from("invites")
      .select("*", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .eq("invite_state", "pending"),
    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .is("deleted_at", null),
  ]);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.settings.organization.eyebrow", undefined, "Settings")}
        title={org.name}
        subtitle={`${members ?? 0} ${members === 1 ? t("console.settings.organization.memberSingular", undefined, "member") : t("console.settings.organization.memberPlural", undefined, "members")} · ${org.tier}`}
      />
      <div className="page-content max-w-4xl space-y-6">
        <div className="metric-grid-4">
          <MetricCard
            label={t("console.settings.organization.metricMembers", undefined, "Members")}
            value={members ?? 0}
            accent
          />
          <MetricCard
            label={t("console.settings.organization.metricPendingInvites", undefined, "Pending invites")}
            value={invites ?? 0}
          />
          <MetricCard
            label={t("console.settings.organization.metricProjects", undefined, "Projects")}
            value={projects ?? 0}
          />
          <MetricCard label={t("console.settings.organization.metricTier", undefined, "Tier")} value={org.tier} />
        </div>

        <div className="surface space-y-4 p-5">
          <h3 className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
            {t("console.settings.organization.profileHeading", undefined, "Organization profile")}
          </h3>
          {isAdmin ? (
            <form action={updateOrgName} className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                name="name"
                defaultValue={org.name}
                required
                minLength={2}
                maxLength={120}
                className="rounded-md border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm"
              />
              <Button type="submit" size="sm">
                {t("common.save", undefined, "Save")}
              </Button>
            </form>
          ) : (
            <Field label={t("console.settings.organization.fieldName", undefined, "Name")} value={org.name} />
          )}
          <Field label={t("console.settings.organization.fieldSlug", undefined, "Slug")} value={org.slug} mono />
          <Field
            label={t("console.settings.organization.fieldTier", undefined, "Tier")}
            value={<Badge variant="brand">{org.tier}</Badge>}
          />
          <Field
            label={t("console.settings.organization.fieldDefaultCurrency", undefined, "Default currency")}
            value={org.default_currency}
            mono
          />
          <Field
            label={t("console.settings.organization.fieldDefaultTimezone", undefined, "Default timezone")}
            value={org.default_timezone}
            mono
          />
          <Field
            label={t("console.settings.organization.fieldCreated", undefined, "Created")}
            value={formatDate(org.created_at, "medium")}
            mono
          />
        </div>

        <div className="surface space-y-4 p-5">
          <h3 className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
            {t("console.settings.organization.paymentTermsHeading", undefined, "Payment terms (templates)")}
          </h3>
          <p className="text-xs text-[var(--p-text-2)]">
            {t(
              "console.settings.organization.paymentTermsBlurb",
              { pct: DEPOSIT_PCT_DEFAULT, balance: BALANCE_TERMS_LABEL_DEFAULT },
              `Org-wide default split for new proposals & engagements. Leave blank to use the system default (${DEPOSIT_PCT_DEFAULT}% deposit, ${BALANCE_TERMS_LABEL_DEFAULT.toLowerCase()}). Each proposal can still override per instance.`,
            )}
          </p>
          {isAdmin ? (
            <form action={updateOrgPaymentDefaults} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <label className="grid gap-1 text-xs font-medium tracking-wide text-[var(--p-text-2)] uppercase">
                {t("console.settings.organization.fieldDefaultDepositPct", undefined, "Default deposit %")}
                <input
                  name="default_deposit_pct"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={org.default_deposit_pct ?? ""}
                  placeholder={String(DEPOSIT_PCT_DEFAULT)}
                  className="rounded-md border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm"
                />
              </label>
              <label className="grid gap-1 text-xs font-medium tracking-wide text-[var(--p-text-2)] uppercase">
                {t("console.settings.organization.fieldDefaultBalanceTerms", undefined, "Balance terms")}
                <select
                  name="default_balance_terms"
                  defaultValue={org.default_balance_terms ?? ""}
                  className="rounded-md border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm"
                >
                  <option value="">
                    {t("console.settings.organization.balanceTermsSystemDefault", undefined, "System default (load-in)")}
                  </option>
                  <option value="load_in">
                    {t("console.settings.organization.balanceTermsLoadIn", undefined, "On load-in")}
                  </option>
                </select>
              </label>
              <Button type="submit" size="sm">
                {t("common.save", undefined, "Save")}
              </Button>
            </form>
          ) : (
            <>
              <Field
                label={t("console.settings.organization.fieldDefaultDepositPct", undefined, "Default deposit %")}
                value={org.default_deposit_pct != null ? `${org.default_deposit_pct}%` : `${DEPOSIT_PCT_DEFAULT}% (system)`}
                mono
              />
              <Field
                label={t("console.settings.organization.fieldDefaultBalanceTerms", undefined, "Balance terms")}
                value={org.default_balance_terms ?? "load_in (system)"}
                mono
              />
            </>
          )}
        </div>

        <div className="surface space-y-3 p-5">
          <h3 className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
            {t("console.settings.organization.memberMgmtHeading", undefined, "Member management")}
          </h3>
          <p className="text-xs text-[var(--p-text-2)]">
            {t(
              "console.settings.organization.memberMgmtBlurb",
              undefined,
              "Member directory + role transitions live under People. Invites land under People · Invites.",
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/studio/people"
              className="rounded-md border border-[var(--p-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--p-surface)]"
            >
              {t("console.settings.organization.linkMemberDirectory", undefined, "Member directory →")}
            </Link>
            <Link
              href="/studio/people/invites"
              className="rounded-md border border-[var(--p-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--p-surface)]"
            >
              {t("console.settings.organization.linkInvites", { count: invites ?? 0 }, "Invites ({count} pending) →")}
            </Link>
            <Link
              href="/studio/people/teams"
              className="rounded-md border border-[var(--p-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--p-surface)]"
            >
              {t("console.settings.organization.linkTeams", undefined, "Teams →")}
            </Link>
            <Link
              href="/studio/people/roles"
              className="rounded-md border border-[var(--p-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--p-surface)]"
            >
              {t("console.settings.organization.linkRoles", undefined, "Roles →")}
            </Link>
          </div>
        </div>

        <div className="surface space-y-3 p-5">
          <h3 className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
            {t("console.settings.organization.workspaceHeading", undefined, "Workspace settings")}
          </h3>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/studio/settings/branding"
              className="rounded-md border border-[var(--p-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--p-surface)]"
            >
              {t("console.settings.organization.linkBranding", undefined, "Branding →")}
            </Link>
            <Link
              href="/studio/settings/domains"
              className="rounded-md border border-[var(--p-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--p-surface)]"
            >
              {t("console.settings.organization.linkDomains", undefined, "Domains →")}
            </Link>
            <Link
              href="/studio/settings/billing"
              className="rounded-md border border-[var(--p-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--p-surface)]"
            >
              {t("console.settings.organization.linkBilling", undefined, "Billing →")}
            </Link>
            <Link
              href="/studio/settings/integrations"
              className="rounded-md border border-[var(--p-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--p-surface)]"
            >
              {t("console.settings.organization.linkIntegrations", undefined, "Integrations →")}
            </Link>
            <Link
              href="/studio/settings/audit"
              className="rounded-md border border-[var(--p-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--p-surface)]"
            >
              {t("console.settings.organization.linkAudit", undefined, "Audit log →")}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--p-border)] pb-3 last:border-none last:pb-0">
      <div className="text-xs font-medium tracking-wide text-[var(--p-text-2)] uppercase">{label}</div>
      <div className={`text-sm ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
