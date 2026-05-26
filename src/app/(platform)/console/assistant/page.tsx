import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type ChunkRow = {
  id: string;
  source_type: string;
  count: number;
  refreshed_at: string | null;
};

type ConversationRow = {
  id: string;
  title: string | null;
  ai_scope: "global" | "project" | "document" | null;
  created_at: string;
  message_count: number;
  project: { name: string | null } | null;
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="AI" title="Assistant" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();

  const [{ data: chunks }, { data: convos }] = await Promise.all([
    supabase.from("document_chunks").select("source_type, refreshed_at").eq("org_id", session.orgId).limit(5000),
    supabase
      .from("ai_conversations")
      .select("id, title, ai_scope, created_at, project:project_id(name)")
      .eq("org_id", session.orgId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  // Roll up chunks by source_type for the corpus snapshot.
  const counts: Record<string, { count: number; latest: string | null }> = {};
  for (const c of (chunks ?? []) as { source_type: string; refreshed_at: string | null }[]) {
    const r = counts[c.source_type] ?? { count: 0, latest: null };
    r.count += 1;
    if (c.refreshed_at && (!r.latest || c.refreshed_at > r.latest)) r.latest = c.refreshed_at;
    counts[c.source_type] = r;
  }
  const corpusRows: ChunkRow[] = Object.entries(counts).map(([source_type, v]) => ({
    id: source_type,
    source_type,
    count: v.count,
    refreshed_at: v.latest,
  }));
  corpusRows.sort((a, b) => b.count - a.count);

  const totalChunks = corpusRows.reduce((s, r) => s + r.count, 0);

  // Hydrate message counts per conversation.
  const convoHeaders = (convos ?? []) as unknown as Omit<ConversationRow, "message_count">[];
  const ids = convoHeaders.map((c) => c.id);
  const msgCounts: Record<string, number> = {};
  if (ids.length > 0) {
    const { data: msgs } = await supabase.from("ai_messages").select("conversation_id").in("conversation_id", ids);
    for (const m of (msgs ?? []) as { conversation_id: string }[]) {
      msgCounts[m.conversation_id] = (msgCounts[m.conversation_id] ?? 0) + 1;
    }
  }
  const conversationRows: ConversationRow[] = convoHeaders.map((c) => ({
    ...c,
    message_count: msgCounts[c.id] ?? 0,
  }));

  return (
    <>
      <ModuleHeader
        eyebrow="AI"
        title="Assistant"
        subtitle={`${fmt.number(totalChunks)} chunks indexed across ${corpusRows.length} source type${corpusRows.length === 1 ? "" : "s"} · ${conversationRows.length} conversation${conversationRows.length === 1 ? "" : "s"}`}
      />
      <div className="page-content space-y-6">
        <div className="metric-grid-3">
          <MetricCard label="Chunks Indexed" value={fmt.number(totalChunks)} accent />
          <MetricCard label="Source Types" value={fmt.number(corpusRows.length)} />
          <MetricCard label="Conversations" value={fmt.number(conversationRows.length)} />
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Corpus snapshot</h2>
          {corpusRows.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)]">
              No chunks indexed yet. The embedding worker (separate ticket) walks deliverables, submittals, RFIs, daily
              logs, spec sections, and drawings to build the RAG index.
            </p>
          ) : (
            <DataTable<ChunkRow>
              rows={corpusRows}
              columns={[
                {
                  key: "source_type",
                  header: "Source",
                  render: (r) => toTitle(r.source_type.replace(/_/g, " ")),
                  accessor: (r) => r.source_type,
                  filterable: true,
                },
                {
                  key: "count",
                  header: "Chunks",
                  render: (r) => fmt.number(r.count),
                  accessor: (r) => r.count,
                  className: "font-mono text-xs text-right",
                },
                {
                  key: "refreshed",
                  header: "Last Refreshed",
                  render: (r) =>
                    r.refreshed_at
                      ? fmt.dateParts(r.refreshed_at, { month: "short", day: "numeric", year: "2-digit" })
                      : "—",
                  accessor: (r) => r.refreshed_at,
                  className: "font-mono text-xs",
                },
              ]}
            />
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent Conversations</h2>
            <Button href="/console/assistant/new" size="sm">
              + New Conversation
            </Button>
          </div>
          <DataTable<ConversationRow>
            rows={conversationRows}
            rowHref={(r) => `/console/assistant/${r.id}`}
            emptyLabel="No conversations yet"
            emptyDescription="The assistant grounds answers on the project corpus — every claim cites the source it came from."
            columns={[
              { key: "title", header: "Title", render: (r) => r.title ?? "(untitled)", accessor: (r) => r.title },
              {
                key: "project",
                header: "Project",
                render: (r) => r.project?.name ?? "—",
                accessor: (r) => r.project?.name ?? null,
                filterable: true,
                groupable: true,
              },
              {
                key: "scope",
                header: "Scope",
                render: (r) =>
                  r.ai_scope ? (
                    <Badge variant="info">{toTitle(r.ai_scope)}</Badge>
                  ) : (
                    <Badge variant="muted">Global</Badge>
                  ),
                accessor: (r) => r.ai_scope ?? "global",
                filterable: true,
                groupable: true,
              },
              {
                key: "messages",
                header: "Msgs",
                render: (r) => fmt.number(r.message_count),
                accessor: (r) => r.message_count,
                className: "font-mono text-xs text-right",
              },
              {
                key: "created",
                header: "Created",
                render: (r) => fmt.dateParts(r.created_at, { month: "short", day: "numeric", year: "2-digit" }),
                accessor: (r) => r.created_at,
                className: "font-mono text-xs",
              },
            ]}
          />
        </section>
      </div>
    </>
  );
}
