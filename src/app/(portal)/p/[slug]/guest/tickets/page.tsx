import { PortalSubpage } from "@/components/PortalSubpage";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { createClient } from "@/lib/supabase/server";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  tier_code: string | null;
  scan_code: string | null;
  fulfillment_state: string;
  holder_name: string | null;
  issued_at: string | null;
};

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t } = await getRequestT();
  const project = await projectIdFromSlug(slug);
  if (!project) {
    return (
      <PortalSubpage
        slug={slug}
        persona="guest"
        title={t("p.guest.tickets.title", undefined, "Tickets")}
        subtitle={t("p.guest.tickets.subtitle", undefined, "Your tickets for this event")}
      >
        <p className="text-sm text-[var(--p-text-2)]">
          {t("p.guest.tickets.projectNotFound", undefined, "Project not found.")}
        </p>
      </PortalSubpage>
    );
  }
  const supabase = await createClient();

  const { data } = await supabase
    .from("assignments")
    .select(
      "id, fulfillment_state, issued_at, party_user_id, party_external_id, ticket_assignment_details(tier_code), assignment_scan_codes(code, active), party_user:users!assignments_party_user_id_fkey(name, email), party_external:assignment_external_holders!assignments_party_external_id_fkey(holder_name, holder_email)",
    )
    .eq("project_id", project.id)
    .eq("catalog_kind", "ticket")
    .is("deleted_at", null)
    .order("issued_at", { ascending: false })
    .limit(500);

  type Raw = {
    id: string;
    fulfillment_state: string;
    issued_at: string | null;
    party_user_id: string | null;
    party_external_id: string | null;
    ticket_assignment_details: { tier_code: string | null } | null;
    assignment_scan_codes: Array<{ code: string; active: boolean }>;
    party_user: { name: string | null; email: string } | null;
    party_external: { holder_name: string | null; holder_email: string | null } | null;
  };
  const rows = ((data ?? []) as unknown as Raw[]).map((r): Row => {
    const activeCode = r.assignment_scan_codes.find((c) => c.active);
    const holderName =
      r.party_user?.name ??
      r.party_user?.email ??
      r.party_external?.holder_name ??
      r.party_external?.holder_email ??
      null;
    return {
      id: r.id,
      tier_code: r.ticket_assignment_details?.tier_code ?? null,
      scan_code: activeCode?.code ?? null,
      fulfillment_state: r.fulfillment_state,
      holder_name: holderName,
      issued_at: r.issued_at,
    };
  });

  return (
    <PortalSubpage
      slug={slug}
      persona="guest"
      title={t("p.guest.tickets.title", undefined, "Tickets")}
      subtitle={t("p.guest.tickets.subtitle", undefined, "Your tickets for this event")}
    >
      <DataTable<Row>
        rows={rows}
        emptyLabel={t("p.guest.tickets.empty", undefined, "No tickets yet — buy or claim to get started")}
        columns={[
          {
            key: "code",
            header: t("p.guest.tickets.columns.code", undefined, "Code"),
            render: (r) => <span className="font-mono text-xs">{r.scan_code ?? "—"}</span>,
            accessor: (r) => r.scan_code ?? null,
          },
          {
            key: "tier",
            header: t("p.guest.tickets.columns.tier", undefined, "Tier"),
            render: (r) => r.tier_code ?? "—",
            accessor: (r) => r.tier_code,
            filterable: true,
            groupable: true,
          },
          {
            key: "holder",
            header: t("p.guest.tickets.columns.holder", undefined, "Holder"),
            render: (r) => r.holder_name ?? "—",
            accessor: (r) => r.holder_name ?? null,
          },
          {
            key: "state",
            header: t("p.guest.tickets.columns.state", undefined, "State"),
            render: (r) => <StatusBadge status={r.fulfillment_state} />,
            accessor: (r) => r.fulfillment_state,
            filterable: true,
            groupable: true,
          },
        ]}
      />
    </PortalSubpage>
  );
}
