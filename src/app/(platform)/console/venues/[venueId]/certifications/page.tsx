import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type VenueRow = { id: string; name: string };
type CertRow = {
  id: string;
  certificate: string;
  issuer: string;
  issued_on: string | null;
  expires_on: string | null;
  file_path: string | null;
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return iso.slice(0, 10);
}

function expiryTone(expires: string | null): "muted" | "success" | "warning" | "error" {
  if (!expires) return "muted";
  const days = Math.floor((new Date(expires).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return "error";
  if (days < 30) return "warning";
  return "success";
}

function expiryLabel(expires: string | null): string {
  if (!expires) return "No expiry";
  const days = Math.floor((new Date(expires).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days < 30) return `Expires in ${days}d`;
  return `Valid · ${days}d`;
}

export default async function Page({ params }: { params: Promise<{ venueId: string }> }) {
  const { venueId } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Venue" title="Certifications" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const [{ data: venueData }, { data: certData }] = await Promise.all([
    supabase.from("venues").select("id, name").eq("id", venueId).eq("org_id", session.orgId).maybeSingle(),
    supabase
      .from("venue_certifications")
      .select("id, certificate, issuer, issued_on, expires_on, file_path")
      .eq("venue_id", venueId)
      .eq("org_id", session.orgId)
      .order("expires_on", { ascending: true, nullsFirst: false }),
  ]);

  const venue = venueData as VenueRow | null;
  if (!venue) notFound();
  const certs = ((certData ?? []) as unknown as CertRow[]) ?? [];

  const expired = certs.filter((c) => c.expires_on && new Date(c.expires_on).getTime() < Date.now()).length;
  const expiring30 = certs.filter((c) => {
    if (!c.expires_on) return false;
    const d = Math.floor((new Date(c.expires_on).getTime() - Date.now()) / 86_400_000);
    return d >= 0 && d < 30;
  }).length;

  return (
    <>
      <ModuleHeader
        eyebrow="Venue"
        title={`${venue.name} — Certifications`}
        subtitle={`${certs.length} Certificate${certs.length === 1 ? "" : "s"} on file`}
        breadcrumbs={[
          { label: "Venues", href: "/console/venues" },
          { label: venue.name, href: `/console/venues/${venue.id}` },
          { label: "Certifications" },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Active" value={fmt.number(certs.length - expired)} accent />
          <MetricCard label="Expiring (≤30d)" value={fmt.number(expiring30)} />
          <MetricCard label="Expired" value={fmt.number(expired)} />
        </div>

        <DataTable<CertRow>
          rows={certs}
          emptyLabel="No certifications uploaded"
          emptyDescription="Track FOP homologation, fire/life-safety, and operating permits here. Each row should link to the issuer's certificate file in storage."
          columns={[
            { key: "certificate", header: "Certificate", render: (r) => r.certificate, accessor: (r) => r.certificate },
            { key: "issuer", header: "Issuer", render: (r) => r.issuer, accessor: (r) => r.issuer },
            {
              key: "issued",
              header: "Issued",
              render: (r) => <span className="font-mono text-xs">{fmtDate(r.issued_on)}</span>,
              accessor: (r) => r.issued_on ?? null,
            },
            {
              key: "expires",
              header: "Expires",
              render: (r) => <span className="font-mono text-xs">{fmtDate(r.expires_on)}</span>,
              accessor: (r) => r.expires_on ?? null,
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <Badge variant={expiryTone(r.expires_on)}>{expiryLabel(r.expires_on)}</Badge>,
              filterable: true,
              groupable: true,
              accessor: (r) => r.expires_on ?? null,
            },
            {
              key: "file",
              header: "File",
              render: (r) =>
                r.file_path ? (
                  <code className="font-mono text-[10px]">{r.file_path.slice(0, 40)}…</code>
                ) : (
                  <span className="text-[var(--text-muted)]">—</span>
                ),
              accessor: (r) => r.file_path ?? null,
            },
          ]}
        />

        <p className="text-xs text-[var(--text-muted)]">
          Certifications gate venue go-live. Operations dashboards check <code>venue_certifications.expires_on</code>{" "}
          and surface anything expiring in the next 30 days.
        </p>
      </div>
    </>
  );
}
