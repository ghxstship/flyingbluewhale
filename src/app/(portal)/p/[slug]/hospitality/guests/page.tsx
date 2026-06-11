import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { toneFor } from "@/lib/tones";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  code: string | null;
  holder_name: string | null;
  holder_email: string | null;
  tier_code: string | null;
  fulfillment_state: string;
  fulfilled_at: string | null;
};

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("p.hospitality.guests.eyebrowShort", undefined, "Portal")}
          title={t("p.hospitality.guests.title", undefined, "Guests")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("p.hospitality.guests.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmtIntl = await getRequestFormatters();

  // Hospitality tier tickets only — common tier_code values: hospitality, vip, suite.
  const { data } = await supabase
    .from("assignments")
    .select(
      "id, fulfillment_state, fulfilled_at, party_user_id, party_external_id, ticket_assignment_details!inner(tier_code), assignment_scan_codes(code, active), party_user:users!assignments_party_user_id_fkey(name, email), party_external:assignment_external_holders!assignments_party_external_id_fkey(holder_name, holder_email)",
    )
    .eq("org_id", session.orgId)
    .eq("catalog_kind", "ticket")
    .is("deleted_at", null)
    .in("ticket_assignment_details.tier_code", ["hospitality", "vip", "suite", "premium"])
    .limit(500);

  type Raw = {
    id: string;
    fulfillment_state: string;
    fulfilled_at: string | null;
    party_user_id: string | null;
    party_external_id: string | null;
    ticket_assignment_details: { tier_code: string | null } | null;
    assignment_scan_codes: Array<{ code: string; active: boolean }>;
    party_user: { name: string | null; email: string } | null;
    party_external: { holder_name: string | null; holder_email: string | null } | null;
  };
  const guests: Row[] = ((data ?? []) as unknown as Raw[]).map((r) => {
    const activeCode = r.assignment_scan_codes.find((c) => c.active);
    return {
      id: r.id,
      code: activeCode?.code ?? null,
      holder_name: r.party_user?.name ?? r.party_external?.holder_name ?? null,
      holder_email: r.party_user?.email ?? r.party_external?.holder_email ?? null,
      tier_code: r.ticket_assignment_details?.tier_code ?? null,
      fulfillment_state: r.fulfillment_state,
      fulfilled_at: r.fulfilled_at,
    };
  });

  const checkedIn = guests.filter((g) => g.fulfilled_at).length;
  const active = guests.filter((g) => g.fulfillment_state === "issued" || g.fulfillment_state === "transferred").length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("p.hospitality.guests.eyebrow", undefined, "Portal · Hospitality")}
        title={t("p.hospitality.guests.title", undefined, "Guests")}
        subtitle={t(
          "p.hospitality.guests.subtitle",
          {
            count: guests.length,
            guestLabel:
              guests.length === 1
                ? t("p.hospitality.guests.guestSingular", undefined, "Guest")
                : t("p.hospitality.guests.guestPlural", undefined, "Guests"),
            checkedIn,
          },
          `${guests.length} Guest${guests.length === 1 ? "" : "s"} · ${checkedIn} checked in`,
        )}
        breadcrumbs={[
          { label: t("p.hospitality.guests.breadcrumb.portal", undefined, "Portal"), href: `/p/${slug}` },
          {
            label: t("p.hospitality.guests.breadcrumb.hospitality", undefined, "Hospitality"),
            href: `/p/${slug}/hospitality`,
          },
          { label: t("p.hospitality.guests.breadcrumb.guests", undefined, "Guests") },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("p.hospitality.guests.metric.active", undefined, "Active")}
            value={fmtIntl.number(active)}
          />
          <MetricCard
            label={t("p.hospitality.guests.metric.checkedIn", undefined, "Checked In")}
            value={fmtIntl.number(checkedIn)}
            accent={checkedIn > 0}
          />
          <MetricCard
            label={t("p.hospitality.guests.metric.total", undefined, "Total")}
            value={fmtIntl.number(guests.length)}
          />
        </div>

        <DataTable<Row>
          rows={guests}
          emptyLabel={t("p.hospitality.guests.emptyLabel", undefined, "No guests yet")}
          emptyDescription={t(
            "p.hospitality.guests.emptyDescription",
            undefined,
            "Hospitality and VIP tickets land here. Add guests to your party via the producer or upload a manifest.",
          )}
          columns={[
            {
              key: "name",
              header: t("p.hospitality.guests.column.guest", undefined, "Guest"),
              render: (r) => r.holder_name ?? "—",
              accessor: (r) => r.holder_name ?? null,
            },
            {
              key: "email",
              header: t("p.hospitality.guests.column.email", undefined, "Email"),
              render: (r) => <span className="text-xs">{r.holder_email ?? "—"}</span>,
              accessor: (r) => r.holder_email ?? null,
            },
            {
              key: "tier",
              header: t("p.hospitality.guests.column.tier", undefined, "Tier"),
              render: (r) => <Badge variant="muted">{r.tier_code ?? "—"}</Badge>,
              accessor: (r) => r.tier_code ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "code",
              header: t("p.hospitality.guests.column.code", undefined, "Code"),
              render: (r) => <span className="font-mono text-[10px]">{r.code ? r.code.slice(-8) : "—"}</span>,
              accessor: (r) => r.code,
            },
            {
              key: "scanned",
              header: t("p.hospitality.guests.column.checkedIn", undefined, "Checked in"),
              render: (r) => <span className="font-mono text-xs">{fmt(r.fulfilled_at)}</span>,
              accessor: (r) => r.fulfilled_at ?? null,
            },
            {
              key: "state",
              header: t("p.hospitality.guests.column.state", undefined, "State"),
              render: (r) => <Badge variant={toneFor(r.fulfillment_state)}>{toTitle(r.fulfillment_state)}</Badge>,
              accessor: (r) => r.fulfillment_state,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
