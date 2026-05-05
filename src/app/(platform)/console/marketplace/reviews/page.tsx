import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type ReviewRow = {
  id: string;
  transaction_type: string;
  subject_kind: string;
  rating: number;
  body: string | null;
  released_at: string | null;
  created_at: string;
  reviewer_user_id: string;
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Marketplace" title="Reviews" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();
  const fmtDate = (iso: string | null) =>
    iso ? fmt.dateParts(iso, { month: "short", day: "numeric", year: "numeric" }) : "—";

  const { data } = await supabase
    .from("reviews")
    .select("id, transaction_type, subject_kind, rating, body, released_at, created_at, reviewer_user_id")
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false })
    .limit(500);

  const rows = (data ?? []) as ReviewRow[];

  return (
    <>
      <ModuleHeader
        eyebrow="Marketplace"
        title="Reviews"
        subtitle="Bidirectional reviews. Hidden until both sides post."
      />
      <div className="page-content space-y-5">
        <DataTable<ReviewRow>
          rows={rows}
          emptyLabel="No reviews yet"
          emptyDescription="Reviews appear after the counterpart posts theirs."
          columns={[
            {
              key: "created",
              header: "Created",
              render: (r) => fmtDate(r.created_at),
              accessor: (r) => r.created_at,
              className: "font-mono text-xs",
            },
            {
              key: "subject",
              header: "Subject",
              render: (r) => <Badge variant="muted">{r.subject_kind}</Badge>,
              accessor: (r) => r.subject_kind,
              filterable: true,
              groupable: true,
            },
            {
              key: "tx",
              header: "Tx",
              render: (r) => <Badge variant="muted">{r.transaction_type}</Badge>,
              accessor: (r) => r.transaction_type,
              filterable: true,
            },
            {
              key: "rating",
              header: "Rating",
              render: (r) => `★ ${r.rating}`,
              accessor: (r) => Number(r.rating),
              className: "font-mono text-xs",
            },
            {
              key: "body",
              header: "Body",
              render: (r) => (r.body ? r.body.slice(0, 80) + (r.body.length > 80 ? "…" : "") : "—"),
              accessor: (r) => r.body ?? null,
            },
            {
              key: "released",
              header: "Released",
              render: (r) =>
                r.released_at ? <Badge variant="success">released</Badge> : <Badge variant="warning">hidden</Badge>,
              accessor: (r) => (r.released_at ? "released" : "hidden"),
              filterable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
