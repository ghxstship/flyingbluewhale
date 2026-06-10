import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  letter_state: string;
  onsite_start_date: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  classification: string;
};

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  accepted: "success",
  declined: "muted",
  withdrawn: "muted",
  expired: "muted",
  sent: "info",
  viewed: "info",
  draft: "default",
};

export default async function Page({ params }: { params: Promise<{ personId: string }> }) {
  const { personId } = await params;
  if (!hasSupabase) return null;
  const { t } = await getRequestT();
  const session = await requireSession();
  const supabase = await createClient();
  // offer_letters.crew_member_id is the FK; resolve via crew_members.user_id
  // (same pattern as the Credentials tab).
  const { data: crewIds } = await supabase
    .from("crew_members")
    .select("id")
    .eq("org_id", session.orgId)
    .eq("user_id", personId);
  const ids = (crewIds ?? []).map((c) => c.id);
  const { data } = ids.length
    ? await supabase
        .from("offer_letters")
        .select("id,letter_state,onsite_start_date,sent_at,accepted_at,declined_at,classification")
        .eq("org_id", session.orgId)
        .in("crew_member_id", ids)
        .order("created_at", { ascending: false })
    : { data: [] };
  const rows = (data ?? []) as Row[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.people.documents.eyebrow", undefined, "Person")}
        title={t("console.people.documents.title", undefined, "Documents")}
        subtitle={t("console.people.documents.subtitle", undefined, "Offer letters and signed agreements.")}
      />
      <div className="page-content">
        <DataTable<Row>
          rows={rows}
          emptyLabel={t("console.people.documents.emptyLabel", undefined, "No Documents")}
          emptyDescription={t(
            "console.people.documents.emptyDescription",
            undefined,
            "No offer letters or agreements on file for this person.",
          )}
          columns={[
            {
              key: "classification",
              header: t("console.people.documents.col.classification", undefined, "Classification"),
              render: (r) => r.classification,
              accessor: (r) => r.classification,
              filterable: true,
            },
            {
              key: "letter_state",
              header: t("console.people.documents.col.letter_state", undefined, "Status"),
              render: (r) => (
                <Badge variant={STATUS_VARIANT[r.letter_state] ?? "default"}>{toTitle(r.letter_state)}</Badge>
              ),
              accessor: (r) => r.letter_state,
              filterable: true,
              groupable: true,
            },
            {
              key: "onsite_start_date",
              header: t("console.people.documents.col.engagementStarts", undefined, "Engagement Starts"),
              render: (r) => (r.onsite_start_date ? formatDate(r.onsite_start_date) : "—"),
              accessor: (r) => r.onsite_start_date ?? "",
              mono: true,
              sortable: true,
            },
            {
              key: "sent_at",
              header: t("console.people.documents.col.sent", undefined, "Sent"),
              render: (r) => (r.sent_at ? formatDate(r.sent_at) : "—"),
              accessor: (r) => r.sent_at ?? "",
              mono: true,
              sortable: true,
            },
            {
              key: "accepted_at",
              header: t("console.people.documents.col.accepted", undefined, "Accepted"),
              render: (r) => (r.accepted_at ? formatDate(r.accepted_at) : "—"),
              accessor: (r) => r.accepted_at ?? "",
              mono: true,
              sortable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
