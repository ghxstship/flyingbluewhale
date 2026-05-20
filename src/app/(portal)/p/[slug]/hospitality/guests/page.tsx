import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Ticket = {
  id: string;
  code: string;
  holder_name: string | null;
  holder_email: string | null;
  tier: string;
  status: string;
  scanned_at: string | null;
};

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning" | "error"> = {
  active: "info",
  used: "success",
  void: "error",
  refunded: "muted",
  comped: "warning",
};

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Portal" title="Guests" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmtIntl = await getRequestFormatters();
  const fmt = (iso: string | null) => (iso ? fmtIntl.dateTime(iso) : "—");
  // Hospitality tier tickets only — common tier names: hospitality, vip, suite.
  const { data } = await supabase
    .from("tickets")
    .select("id, code, holder_name, holder_email, tier, status, scanned_at")
    .eq("org_id", session.orgId)
    .in("tier", ["hospitality", "vip", "suite", "premium"])
    .order("holder_name", { ascending: true });

  const guests = ((data ?? []) as unknown as Ticket[]) ?? [];
  const checkedIn = guests.filter((g) => g.scanned_at).length;
  const active = guests.filter((g) => g.status === "active").length;

  return (
    <>
      <ModuleHeader
        eyebrow="Portal · Hospitality"
        title="Guests"
        subtitle={`${guests.length} guest${guests.length === 1 ? "" : "s"} · ${checkedIn} checked in`}
        breadcrumbs={[
          { label: "Portal", href: `/p/${slug}` },
          { label: "Hospitality", href: `/p/${slug}/hospitality` },
          { label: "Guests" },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Active" value={fmtIntl.number(active)} />
          <MetricCard label="Checked In" value={fmtIntl.number(checkedIn)} accent={checkedIn > 0} />
          <MetricCard label="Total" value={fmtIntl.number(guests.length)} />
        </div>

        <DataTable<Ticket>
          rows={guests}
          emptyLabel="No guests yet"
          emptyDescription="Hospitality and VIP tickets land here. Add guests to your party via the producer or upload a manifest."
          columns={[
            {
              key: "name",
              header: "Guest",
              render: (r) => r.holder_name ?? "—",
              accessor: (r) => r.holder_name ?? null,
            },
            {
              key: "email",
              header: "Email",
              render: (r) => <span className="text-xs">{r.holder_email ?? "—"}</span>,
              accessor: (r) => r.holder_email ?? null,
            },
            {
              key: "tier",
              header: "Tier",
              render: (r) => <Badge variant="muted">{r.tier}</Badge>,
              accessor: (r) => r.tier ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "code",
              header: "Code",
              render: (r) => <span className="font-mono text-[10px]">{r.code.slice(-8)}</span>,
              accessor: (r) => r.code.slice ?? null,
            },
            {
              key: "scanned",
              header: "Checked in",
              render: (r) => <span className="font-mono text-xs">{fmt(r.scanned_at)}</span>,
              accessor: (r) => r.scanned_at ?? null,
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{r.status}</Badge>,
              accessor: (r) => r.status ?? null,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
