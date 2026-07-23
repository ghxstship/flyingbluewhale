import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataView } from "@/components/views/DataViewServer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { isDocState } from "@/lib/collaborate";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  title: string;
  doc_state: string;
  updated_at: string;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.collaborate.docs.eyebrow", undefined, "Collaborate")}
          title={t("console.collaborate.docs.title", undefined, "Pages")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.collaborate.docs.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  // `collab_docs` is not yet in the generated Database types (PENDING
  // migration), so go through the LooseSupabase cast until types regen.
  const { data } = await (supabase as unknown as LooseSupabase)
    .from("collab_docs")
    .select("id, title, doc_state, updated_at")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(1000);
  const rows = ((data ?? []) as Row[]).filter((r) => isDocState(r.doc_state));

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.collaborate.docs.eyebrow", undefined, "Collaborate")}
        title={t("console.collaborate.docs.title", undefined, "Pages")}
        subtitle={t(
          "console.collaborate.docs.subtitle",
          undefined,
          "Block documents authored in the rich-text editor. Single-user editing.",
        )}
        action={
          <Button href="/studio/collaborate/docs/new" size="sm">
            {t("console.collaborate.docs.newLabel", undefined, "+ New Document")}
          </Button>
        }
      />
      <div className="page-content">
        <DataView<Row>
          rows={rows}
          rowHref={(r) => `/studio/collaborate/docs/${r.id}`}
          emptyLabel={t("console.collaborate.docs.emptyLabel", undefined, "No documents yet")}
          emptyDescription={t(
            "console.collaborate.docs.emptyDescription",
            undefined,
            "Create a block document to draft runbooks, briefs, and notes, with an AI callout that drafts a paragraph for you.",
          )}
          columns={[
            {
              key: "title",
              header: t("console.collaborate.docs.columns.title", undefined, "Title"),
              render: (r) => r.title,
              sortable: true,
            },
            {
              key: "doc_state",
              header: t("console.collaborate.docs.columns.state", undefined, "Status"),
              render: (r) => <StatusBadge status={r.doc_state} />,
              filterable: true,
              accessor: (r) => r.doc_state,
            },
            {
              key: "updated_at",
              header: t("console.collaborate.docs.columns.updated", undefined, "Updated"),
              render: (r) => fmt.dateTime(new Date(r.updated_at)),
              sortable: true,
              accessor: (r) => r.updated_at,
            },
          ]}
        />
      </div>
    </>
  );
}
