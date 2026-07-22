import { ModuleHeader } from "@/components/Shell";
import { DataView } from "@/components/views/DataViewServer";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

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
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.marketplace.reviews.eyebrow", undefined, "Marketplace")}
          title={t("console.marketplace.reviews.title", undefined, "Reviews")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.marketplace.reviews.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
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
        eyebrow={t("console.marketplace.reviews.eyebrow", undefined, "Marketplace")}
        title={t("console.marketplace.reviews.title", undefined, "Reviews")}
        subtitle={t(
          "console.marketplace.reviews.subtitle",
          undefined,
          "Bidirectional reviews. Hidden until both sides post.",
        )}
      />
      <div className="page-content space-y-5">
        <DataView<ReviewRow>
          rows={rows}
          emptyLabel={t("console.marketplace.reviews.emptyLabel", undefined, "No reviews yet")}
          emptyDescription={t(
            "console.marketplace.reviews.emptyDescription",
            undefined,
            "Reviews appear after the counterpart posts theirs.",
          )}
          columns={[
            {
              key: "created",
              header: t("console.marketplace.reviews.col.created", undefined, "Created"),
              render: (r) => fmtDate(r.created_at),
              accessor: (r) => r.created_at,
              mono: true,
            },
            {
              key: "subject",
              header: t("console.marketplace.reviews.col.subject", undefined, "Subject"),
              render: (r) => <Badge variant="muted">{toTitle(r.subject_kind)}</Badge>,
              accessor: (r) => r.subject_kind,
              filterable: true,
              groupable: true,
            },
            {
              key: "tx",
              header: t("console.marketplace.reviews.col.tx", undefined, "Tx"),
              render: (r) => <Badge variant="muted">{toTitle(r.transaction_type)}</Badge>,
              accessor: (r) => r.transaction_type,
              filterable: true,
            },
            {
              key: "rating",
              header: t("console.marketplace.reviews.col.rating", undefined, "Rating"),
              render: (r) => `★ ${r.rating}`,
              accessor: (r) => Number(r.rating),
              mono: true,
            },
            {
              key: "body",
              header: t("console.marketplace.reviews.col.body", undefined, "Body"),
              render: (r) => (r.body ? r.body.slice(0, 80) + (r.body.length > 80 ? "…" : "") : "—"),
              accessor: (r) => r.body ?? null,
            },
            {
              key: "released",
              header: t("console.marketplace.reviews.col.released", undefined, "Released"),
              render: (r) =>
                r.released_at ? (
                  <Badge variant="success">
                    {t("console.marketplace.reviews.status.released", undefined, "released")}
                  </Badge>
                ) : (
                  <Badge variant="warning">{t("console.marketplace.reviews.status.hidden", undefined, "hidden")}</Badge>
                ),
              accessor: (r) => (r.released_at ? "released" : "hidden"),
              filterable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
