import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  kind: string;
  number: string | null;
  issued_on: string | null;
  expires_on: string | null;
};

export default async function Page({ params }: { params: Promise<{ personId: string }> }) {
  const { personId } = await params;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  // credentials.crew_member_id is the FK; resolve via crew_members.user_id
  // so the tab works for any auth user even if multiple crew rows exist.
  const { data: crewIds } = await supabase
    .from("crew_members")
    .select("id")
    .eq("org_id", session.orgId)
    .eq("user_id", personId);
  const ids = (crewIds ?? []).map((c) => c.id);
  const { data } = ids.length
    ? await supabase
        .from("credentials")
        .select("id,kind,number,issued_on,expires_on")
        .eq("org_id", session.orgId)
        .in("crew_member_id", ids)
        .order("expires_on", { ascending: true })
    : { data: [] };
  const rows = (data ?? []) as Row[];

  return (
    <>
      <ModuleHeader eyebrow="Person" title="Credentials" subtitle="Certifications, licenses, and IDs." />
      <div className="page-content">
        <DataTable<Row>
          rows={rows}
          emptyLabel="No Credentials"
          emptyDescription="No credentials are recorded for this person. Add one from the Credentials register."
          columns={[
            { key: "kind", header: "Kind", render: (r) => r.kind, accessor: (r) => r.kind, filterable: true },
            {
              key: "number",
              header: "Number",
              render: (r) => r.number ?? "—",
              accessor: (r) => r.number ?? "",
              mono: true,
            },
            {
              key: "issued_on",
              header: "Issued",
              render: (r) => (r.issued_on ? formatDate(r.issued_on) : "—"),
              accessor: (r) => r.issued_on ?? "",
              mono: true,
              sortable: true,
            },
            {
              key: "expires_on",
              header: "Expires",
              render: (r) => (r.expires_on ? formatDate(r.expires_on) : "—"),
              accessor: (r) => r.expires_on ?? "",
              mono: true,
              sortable: true,
            },
            {
              key: "status",
              header: "Status",
              render: (r) => {
                const expired = r.expires_on ? new Date(r.expires_on).getTime() < Date.now() : false;
                return <Badge variant={expired ? "error" : "success"}>{expired ? "Expired" : "Valid"}</Badge>;
              },
              accessor: (r) => (r.expires_on && new Date(r.expires_on).getTime() < Date.now() ? "expired" : "valid"),
              filterable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
