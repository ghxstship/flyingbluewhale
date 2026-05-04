import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

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

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

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
    | "hospitality";
  slug: string;
}) {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Portal" title="Privacy" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const [{ data: dsarData }, { data: consentData }] = await Promise.all([
    supabase
      .from("dsar_requests")
      .select("id, kind, status, requester_email, due_by, fulfilled_at, created_at")
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
        eyebrow="Portal · Privacy"
        title="Your Data"
        subtitle="Submit a data subject access request, manage consent, or download what we hold about you."
        breadcrumbs={[
          { label: "Portal", href: `/p/${slug}` },
          { label: persona, href: `/p/${slug}/${persona}` },
          { label: "Privacy" },
        ]}
      />
      <div className="page-content space-y-6">
        <div className="metric-grid-3">
          <MetricCard label="Open Requests" value={open.toLocaleString()} />
          <MetricCard label="Total Requests" value={dsars.length.toLocaleString()} />
          <MetricCard label="Active Consents" value={grantedConsents.toLocaleString()} />
        </div>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">Submit a Request</h3>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Under your jurisdiction's privacy law (GDPR, CCPA, LGPD, etc.) you may request access, portability,
            correction, or erasure of personal data we process about you.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Link href="/api/v1/me/export" className="btn btn-primary btn-sm w-full justify-center">
              Download my data (JSON)
            </Link>
            <Link
              href={`mailto:privacy@lytehaus.tech?subject=DSAR%20—%20${persona}%20${slug}`}
              className="btn btn-secondary btn-sm w-full justify-center"
            >
              Email a DSAR
            </Link>
          </div>
        </section>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">Your Requests</h3>
          {dsars.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              No requests on record. New ones land here once submitted.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--border-color)]">
              {dsars.map((d) => (
                <li key={d.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <div className="font-medium">{d.kind.replace(/_/g, " ")}</div>
                    <div className="font-mono text-[10px] text-[var(--text-muted)]">
                      filed {fmt(d.created_at)}
                      {d.due_by ? ` · due ${fmt(d.due_by)}` : ""}
                      {d.fulfilled_at ? ` · fulfilled ${fmt(d.fulfilled_at)}` : ""}
                    </div>
                  </div>
                  <Badge variant={DSAR_TONE[d.status] ?? "muted"}>{d.status.replace(/_/g, " ")}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">Consent Ledger</h3>
          {consents.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              No consent records yet. When you grant or revoke consent for a specific purpose, it lands here.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--border-color)]">
              {consents.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <div className="font-medium">{c.purpose}</div>
                    <div className="font-mono text-[10px] text-[var(--text-muted)]">
                      {c.granted_at ? `granted ${fmt(c.granted_at)}` : "—"}
                      {c.version ? ` · v${c.version}` : ""}
                      {c.revoked_at ? ` · revoked ${fmt(c.revoked_at)}` : ""}
                    </div>
                  </div>
                  <Badge variant={c.granted && !c.revoked_at ? "success" : "muted"}>
                    {c.granted && !c.revoked_at ? "granted" : "revoked"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-xs text-[var(--text-muted)]">
          Data we process about you depends on your role. As a <strong>{persona}</strong> you may have records in:
          accreditations, credentials, advancing rider, contracts, payments, scans, and signed disclosures. Requesting
          erasure may impact your active engagement — we'll confirm before processing.
        </p>
      </div>
    </>
  );
}
