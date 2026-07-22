import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

type DsarRow = {
  id: string;
  kind: string;
  status: string;
  requester_email: string;
  due_by: string | null;
  fulfilled_at: string | null;
  created_at: string;
};

type ConsentRow = {
  id: string;
  purpose: string;
  granted: boolean;
  granted_at: string | null;
  revoked_at: string | null;
  version: string | null;
};

const DSAR_TONE: Record<string, "muted" | "info" | "warning" | "success" | "error"> = {
  open: "info",
  in_progress: "warning",
  fulfilled: "success",
  rejected: "error",
  closed: "muted",
};

/**
 * Persona-scoped DSAR + consent panel for portal /privacy routes.
 * Each persona (artist, vendor, client, crew, guest, sponsor) can request
 * data export / erasure / correction and view their consent ledger.
 *
 * The viewer's own DSARs are surfaced (RLS narrows to requester_user_id =
 * auth.uid()), and consent records show what they've granted to the org.
 */
export async function PortalPrivacyPanel({
  persona,
  slug,
}: {
  persona:
    | "artist"
    | "vendor"
    | "client"
    | "crew"
    | "guest"
    | "sponsor"
    | "athlete"
    | "delegation"
    | "media"
    | "vip"
    | "volunteer"
    | "hospitality"
    // Executive personas — DSAR/privacy is a universal data-subject right,
    // and this panel is auth.uid()-scoped (persona is label-only), so the
    // co-pro / producer / board counterparts get the same self-service.
    | "promoter"
    | "producer"
    | "stakeholder";
  slug: string;
}) {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("components.portalPrivacyPanel.eyebrow", undefined, "Portal")}
          title={t("components.portalPrivacyPanel.privacy", undefined, "Privacy")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("components.portalPrivacyPanel.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmtter = await getRequestFormatters();
  const fmt = (iso: string | null): string =>
    iso ? fmtter.dateParts(iso, { month: "short", day: "numeric", year: "numeric" }) : "—";

  const [{ data: dsarData }, { data: consentData }] = await Promise.all([
    supabase
      .from("dsar_requests")
      .select("id, kind, request_state, requester_email, due_by, fulfilled_at, created_at")
      .eq("org_id", session.orgId)
      .eq("requester_user_id", session.userId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("consent_records")
      .select("id, purpose, granted, granted_at, revoked_at, version")
      .eq("org_id", session.orgId)
      .eq("user_id", session.userId)
      .order("granted_at", { ascending: false }),
  ]);

  const dsars = ((dsarData ?? []) as unknown as DsarRow[]) ?? [];
  const consents = ((consentData ?? []) as unknown as ConsentRow[]) ?? [];
  const open = dsars.filter((d) => d.status === "open" || d.status === "in_progress").length;
  const grantedConsents = consents.filter((c) => c.granted && !c.revoked_at).length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("components.portalPrivacyPanel.headerEyebrow", undefined, "Portal · Privacy")}
        title={t("components.portalPrivacyPanel.title", undefined, "Your Data")}
        subtitle={t(
          "components.portalPrivacyPanel.subtitle",
          undefined,
          "Submit a data subject access request, manage consent, or download what we hold about you.",
        )}
        breadcrumbs={[
          { label: t("components.portalPrivacyPanel.eyebrow", undefined, "Portal"), href: `/p/${slug}` },
          { label: persona, href: `/p/${slug}/${persona}` },
          { label: t("components.portalPrivacyPanel.privacy", undefined, "Privacy") },
        ]}
      />
      <div className="page-content space-y-6">
        <div className="metric-grid-3">
          <MetricCard
            label={t("components.portalPrivacyPanel.openRequests", undefined, "Open Requests")}
            value={fmtter.number(open)}
          />
          <MetricCard
            label={t("components.portalPrivacyPanel.totalRequests", undefined, "Total Requests")}
            value={fmtter.number(dsars.length)}
          />
          <MetricCard
            label={t("components.portalPrivacyPanel.activeConsents", undefined, "Active Consents")}
            value={fmtter.number(grantedConsents)}
          />
        </div>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">
            {t("components.portalPrivacyPanel.submitRequest", undefined, "Submit a Request")}
          </h3>
          <p className="mt-1 text-xs text-[var(--p-text-2)]">
            {t(
              "components.portalPrivacyPanel.submitRequestBody",
              undefined,
              "Under your jurisdiction's privacy law (GDPR, CCPA, LGPD, etc.) you may request access, portability, correction, or erasure of personal data we process about you.",
            )}
          </p>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Link href="/api/v1/me/export" className="ps-btn ps-btn--sm w-full justify-center">
              {t("components.portalPrivacyPanel.downloadData", undefined, "Download my data · JSON")}
            </Link>
            <Link
              href={`mailto:privacy@atlvs.pro?subject=DSAR%3A%20${persona}%20${slug}`}
              className="ps-btn ps-btn--ghost ps-btn--sm w-full justify-center"
            >
              {t("components.portalPrivacyPanel.emailDsar", undefined, "Email a DSAR")}
            </Link>
          </div>
        </section>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">
            {t("components.portalPrivacyPanel.yourRequests", undefined, "Your Requests")}
          </h3>
          {dsars.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--p-text-2)]">
              {t(
                "components.portalPrivacyPanel.noRequests",
                undefined,
                "No requests on record. New ones land here once submitted.",
              )}
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--p-border)]">
              {dsars.map((d) => (
                <li key={d.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <div className="font-medium">{toTitle(d.kind)}</div>
                    <div className="font-mono text-[11px] text-[var(--p-text-2)]">
                      {t("components.portalPrivacyPanel.filed", { date: fmt(d.created_at) }, "filed {date}")}
                      {d.due_by
                        ? ` · ${t("components.portalPrivacyPanel.due", { date: fmt(d.due_by) }, "due {date}")}`
                        : ""}
                      {d.fulfilled_at
                        ? ` · ${t("components.portalPrivacyPanel.fulfilled", { date: fmt(d.fulfilled_at) }, "fulfilled {date}")}`
                        : ""}
                    </div>
                  </div>
                  <Badge variant={DSAR_TONE[d.status] ?? "muted"}>{toTitle(d.status)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">
            {t("components.portalPrivacyPanel.consentLedger", undefined, "Consent Ledger")}
          </h3>
          {consents.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--p-text-2)]">
              {t(
                "components.portalPrivacyPanel.noConsents",
                undefined,
                "No consent records yet. When you grant or revoke consent for a specific purpose, it lands here.",
              )}
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--p-border)]">
              {consents.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <div className="font-medium">{c.purpose}</div>
                    <div className="font-mono text-[11px] text-[var(--p-text-2)]">
                      {c.granted_at
                        ? t("components.portalPrivacyPanel.granted", { date: fmt(c.granted_at) }, "granted {date}")
                        : "—"}
                      {c.version ? ` · v${c.version}` : ""}
                      {c.revoked_at
                        ? ` · ${t("components.portalPrivacyPanel.revoked", { date: fmt(c.revoked_at) }, "revoked {date}")}`
                        : ""}
                    </div>
                  </div>
                  <Badge variant={c.granted && !c.revoked_at ? "success" : "muted"}>
                    {c.granted && !c.revoked_at
                      ? t("components.portalPrivacyPanel.statusGranted", undefined, "granted")
                      : t("components.portalPrivacyPanel.statusRevoked", undefined, "revoked")}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-xs text-[var(--p-text-2)]">
          {t(
            "components.portalPrivacyPanel.roleNoteBefore",
            undefined,
            "Data we process about you depends on your role. As a",
          )}{" "}
          <strong>{persona}</strong>{" "}
          {t(
            "components.portalPrivacyPanel.roleNoteAfter",
            undefined,
            "you may have records in: accreditations, credentials, advancing rider, contracts, payments, scans, and signed disclosures. Requesting erasure may impact your active engagement. We'll confirm before processing.",
          )}
        </p>
      </div>
    </>
  );
}
