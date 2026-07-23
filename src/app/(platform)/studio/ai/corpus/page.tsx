import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { DataView } from "@/components/views/DataViewServer";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { timeAgo } from "@/lib/format";
import { kbVerification } from "@/lib/kb/verification";
import { rollupChunks, type CorpusSourceRow } from "@/lib/ai/corpus";
import { DeleteForm } from "@/components/DeleteForm";
import { ReindexButton } from "./ReindexButton";
import { refreshLinkAction, removeLinkAction, syncArticleFromForm } from "./event-actions";

type CorpusLink = {
  project_id: string;
  source_type: string;
  source_id: string;
  last_synced_at: string | null;
};

type ArticleMeta = {
  id: string;
  slug: string;
  title: string;
  verified_at: string | null;
  review_interval_days: number;
  updated_at: string;
};

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
  const { t } = await getRequestT();

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

  // ── Event corpus (L-P5): per-active-event linked knowledge sources ──
  const canManage = isManagerPlus(session);
  const [{ data: projectRows }, linksResult, { data: articleRows }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name")
      .eq("org_id", session.orgId)
      .eq("project_state", "active")
      .is("deleted_at", null)
      .order("name")
      .limit(50),
    supabase
      .from("project_corpus_links")
      .select("project_id, source_type, source_id, last_synced_at")
      .eq("org_id", session.orgId)
      .limit(2000),
    supabase
      .from("kb_articles")
      .select("id, slug, title, verified_at, review_interval_days, updated_at")
      .eq("org_id", session.orgId)
      .order("title")
      .limit(2000),
  ]);
  const projects = (projectRows ?? []) as { id: string; name: string }[];
  // Pre-migration the table doesn't exist — the select errors; degrade to an
  // explanatory empty panel instead of crashing.
  const linksAvailable = !linksResult.error;
  const links = (linksResult.data ?? []) as CorpusLink[];
  const articles = (articleRows ?? []) as ArticleMeta[];
  const articleById = new Map(articles.map((a) => [a.id, a]));
  const now = Date.now();
  const syncableArticles = articles.filter(
    (a) => kbVerification(a.verified_at, a.review_interval_days, now).state === "verified",
  );

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
          Reindex walks this org&apos;s deliverables, submittals, RFIs, verified knowledge articles,
          published SOPs, and event guides, and feeds each to the embedding worker on demand.
          Continuous, scheduled indexing requires a cron registration (a scheduled job that calls
          an authenticated batch route). Not yet wired. An embedding provider key (OPENAI_API_KEY
          or VOYAGE_API_KEY) must be configured for embeddings to be written.
        </Alert>

        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold">
              {t("console.aiCorpus.eventCorpus.title", undefined, "Event corpus")}
            </h2>
            <p className="text-xs" style={{ color: "var(--p-text-3)" }}>
              {t(
                "console.aiCorpus.eventCorpus.subtitle",
                undefined,
                "What each active event's grounded answers can draw on. Only verified knowledge articles are event-syncable; org standards (SOPs, contracts) and the event's own documents are always in scope.",
              )}
            </p>
          </div>

          {!linksAvailable ? (
            <Alert
              kind="warning"
              title={t("console.aiCorpus.eventCorpus.pendingTitle", undefined, "Pending migration")}
            >
              {t(
                "console.aiCorpus.eventCorpus.pendingBody",
                undefined,
                "Event corpus sync needs the project_corpus_links migration applied before sources can be pinned to events.",
              )}
            </Alert>
          ) : projects.length === 0 ? (
            <div className="surface p-6 text-sm" style={{ color: "var(--p-text-2)" }}>
              {t("console.aiCorpus.eventCorpus.noProjects", undefined, "No active events.")}
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((p) => {
                const projectLinks = links.filter((l) => l.project_id === p.id);
                return (
                  <div key={p.id} className="surface p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold">{p.name}</div>
                      <span className="text-xs" style={{ color: "var(--p-text-3)" }}>
                        {t(
                          "console.aiCorpus.eventCorpus.linkedCount",
                          { count: String(projectLinks.length) },
                          `${projectLinks.length} linked ${projectLinks.length === 1 ? "source" : "sources"}`,
                        )}
                      </span>
                    </div>

                    {projectLinks.length === 0 ? (
                      <p className="text-xs" style={{ color: "var(--p-text-3)" }}>
                        {t(
                          "console.aiCorpus.eventCorpus.empty",
                          undefined,
                          "No knowledge synced to this event yet. Answers ground on the event's own documents and org standards only.",
                        )}
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {projectLinks.map((l) => {
                          const article = l.source_type === "kb_article" ? articleById.get(l.source_id) : undefined;
                          const verification = article
                            ? kbVerification(article.verified_at, article.review_interval_days, now)
                            : null;
                          const needsRefresh =
                            !!article && (!l.last_synced_at || article.updated_at > l.last_synced_at);
                          return (
                            <li
                              key={`${l.source_type}-${l.source_id}`}
                              className="flex flex-wrap items-center gap-2 text-sm"
                            >
                              {article ? (
                                <Link href={`/studio/knowledge/${article.slug}`} className="font-medium hover:underline">
                                  {article.title}
                                </Link>
                              ) : (
                                <span className="font-mono text-xs">{l.source_id}</span>
                              )}
                              {verification?.state === "verified" && (
                                <Badge variant="success">
                                  {t("console.aiCorpus.eventCorpus.verified", undefined, "Verified")}
                                </Badge>
                              )}
                              {verification?.state === "stale" && (
                                <Badge variant="warning">
                                  {t(
                                    "console.aiCorpus.eventCorpus.staleVerification",
                                    undefined,
                                    "Verification lapsed · excluded until re-verified",
                                  )}
                                </Badge>
                              )}
                              {verification?.state === "unverified" && (
                                <Badge variant="warning">
                                  {t(
                                    "console.aiCorpus.eventCorpus.unverified",
                                    undefined,
                                    "Unverified · excluded",
                                  )}
                                </Badge>
                              )}
                              <span className="text-xs" style={{ color: "var(--p-text-3)" }}>
                                {l.last_synced_at
                                  ? t(
                                      "console.aiCorpus.eventCorpus.embedded",
                                      { when: timeAgo(l.last_synced_at) },
                                      `Embedded ${timeAgo(l.last_synced_at)}`,
                                    )
                                  : t("console.aiCorpus.eventCorpus.notEmbedded", undefined, "Not embedded yet")}
                              </span>
                              {needsRefresh && (
                                <Badge variant="warning">
                                  {t("console.aiCorpus.eventCorpus.needsRefresh", undefined, "Edited since sync")}
                                </Badge>
                              )}
                              {canManage && article && (
                                <span className="ml-auto flex items-center gap-2">
                                  <form action={refreshLinkAction.bind(null, l.source_id, p.id)}>
                                    <Button type="submit" size="sm" variant="secondary">
                                      {t("console.aiCorpus.eventCorpus.refresh", undefined, "Refresh")}
                                    </Button>
                                  </form>
                                  <DeleteForm
                                    action={removeLinkAction.bind(null, p.id, l.source_type, l.source_id)}
                                    label={t("console.aiCorpus.eventCorpus.remove", undefined, "Remove")}
                                    title={t("console.aiCorpus.eventCorpus.removeTitle", undefined, "Remove from event corpus")}
                                    confirm={t(
                                      "console.aiCorpus.eventCorpus.removeConfirm",
                                      undefined,
                                      "Remove this source from the event's grounded answers? The article itself is not deleted.",
                                    )}
                                  />
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}

              {canManage && (
                <form action={syncArticleFromForm} className="surface p-4 flex flex-wrap items-end gap-3">
                  <label className="flex flex-col gap-1 text-xs font-medium">
                    {t("console.aiCorpus.eventCorpus.articleLabel", undefined, "Verified article")}
                    <select name="articleId" className="ps-input" required defaultValue="">
                      <option value="" disabled>
                        {t("console.aiCorpus.eventCorpus.articlePlaceholder", undefined, "Choose an article")}
                      </option>
                      {syncableArticles.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-medium">
                    {t("console.aiCorpus.eventCorpus.projectLabel", undefined, "Event")}
                    <select name="projectId" className="ps-input" required defaultValue="">
                      <option value="" disabled>
                        {t("console.aiCorpus.eventCorpus.projectPlaceholder", undefined, "Choose an event")}
                      </option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button type="submit" size="sm">
                    {t("console.aiCorpus.eventCorpus.sync", undefined, "Sync to event")}
                  </Button>
                  <p className="basis-full text-xs" style={{ color: "var(--p-text-3)" }}>
                    {t(
                      "console.aiCorpus.eventCorpus.gateNote",
                      undefined,
                      "Only currently verified articles are listed. Stale or unverified knowledge cannot ground an event's answers.",
                    )}
                  </p>
                </form>
              )}
            </div>
          )}
        </section>

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
