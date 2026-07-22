import { ModuleHeader } from "@/components/Shell";
import { DataView } from "@/components/views/DataViewServer";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters } from "@/lib/i18n/request";
import { rollupChunks, type CorpusSourceRow } from "@/lib/ai/corpus";
import { ReindexButton } from "./ReindexButton";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="AI" title="RAG Corpus" />
        <ConfigureSupabase />
      </>
    );
  }

  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();

  const { data: chunks } = await supabase
    .from("document_chunks")
    .select("source_type, source_id, refreshed_at")
    .eq("org_id", session.orgId)
    .limit(20000);

  const rows = rollupChunks(
    (chunks ?? []) as { source_type: string; source_id: string; refreshed_at: string | null }[],
  );

  const totalChunks = rows.reduce((s, r) => s + r.chunk_count, 0);
  const totalDocs = rows.reduce((s, r) => s + r.document_count, 0);

  return (
    <>
      <ModuleHeader
        eyebrow="AI"
        title="RAG Corpus"
        subtitle={`${fmt.number(totalDocs)} documents · ${fmt.number(totalChunks)} chunks indexed across ${rows.length} source ${rows.length === 1 ? "type" : "types"}`}
        action={<ReindexButton />}
      />
      <div className="page-content space-y-6">
        <div className="metric-grid-3">
          <MetricCard label="Documents Indexed" value={fmt.number(totalDocs)} accent />
          <MetricCard label="Chunks" value={fmt.number(totalChunks)} />
          <MetricCard label="Source Types" value={fmt.number(rows.length)} />
        </div>

        <Alert kind="info" title="Manual indexing only">
          Reindex walks this org&apos;s deliverables, submittals, and RFIs and feeds each to the
          embedding worker on demand. Continuous, scheduled indexing requires a cron registration
          (a scheduled job that calls an authenticated batch route). Not yet wired. An embedding
          provider key (OPENAI_API_KEY or VOYAGE_API_KEY) must be configured for embeddings to be
          written.
        </Alert>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Indexed sources</h2>
          <DataView<CorpusSourceRow>
            rows={rows}
            emptyLabel="No sources indexed yet"
            emptyDescription="Run Reindex to walk deliverables, submittals, and RFIs into the RAG corpus."
            columns={[
              {
                key: "source",
                header: "Source",
                render: (r) => (
                  <span className="inline-flex items-center gap-2">
                    {r.label}
                    {r.reindexable ? (
                      <Badge variant="success">Walked</Badge>
                    ) : (
                      <Badge variant="muted">External</Badge>
                    )}
                  </span>
                ),
                accessor: (r) => r.label,
                filterable: true,
              },
              {
                key: "documents",
                header: "Documents",
                render: (r) => fmt.number(r.document_count),
                accessor: (r) => r.document_count,
                numeric: true,
              },
              {
                key: "chunks",
                header: "Chunks",
                render: (r) => fmt.number(r.chunk_count),
                accessor: (r) => r.chunk_count,
                numeric: true,
              },
              {
                key: "refreshed",
                header: "Refreshed",
                render: (r) =>
                  r.refreshed_at
                    ? fmt.dateParts(r.refreshed_at, { month: "short", day: "numeric", year: "2-digit" })
                    : "—",
                accessor: (r) => r.refreshed_at,
                mono: true,
              },
            ]}
          />
        </section>
      </div>
    </>
  );
}
