import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { KnowledgeView, type ArticleRow } from "./KnowledgeView";

/**
 * COMPVSS · Knowledge — kit 28 `library` (/m/docs).
 *
 * "Offline-cached SOPs & policies. Category filter. Must-read articles
 * require acknowledgement; row opens the article."
 *
 * This route spent months occupied by the OTHER document surface (SiteDocs,
 * now correctly at /m/documents) — the two kit surfaces were conflated into
 * one path, so Knowledge read as missing while its route was busy. Backed by
 * `sops` (published only) + `sop_acknowledgements` for the must-read state.
 *
 * "Offline-cached" is the service worker's runtime cache: a visited article
 * re-serves offline with the stale banner. Nothing here claims a precache
 * that doesn't exist.
 */
export const dynamic = "force-dynamic";

export default async function KnowledgePage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div className="screen">{t("m.docs.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }
  const session = await requireSession();
  const supabase = await createClient();

  const [{ data: sopRows }, { data: ackRows }] = await Promise.all([
    supabase
      .from("sops")
      .select("id, code, title, purpose, category, must_read, updated_at")
      .eq("org_id", session.orgId)
      .eq("sop_state", "published")
      .is("deleted_at", null)
      .order("must_read", { ascending: false })
      .order("title")
      .limit(200),
    supabase.from("sop_acknowledgements").select("sop_id").eq("org_id", session.orgId).eq("user_id", session.userId),
  ]);

  const acked = new Set(((ackRows ?? []) as Array<{ sop_id: string }>).map((a) => a.sop_id));

  const rows: ArticleRow[] = (
    (sopRows ?? []) as Array<{
      id: string;
      code: string;
      title: string;
      purpose: string | null;
      category: string | null;
      must_read: boolean;
    }>
  ).map((s) => ({
    id: s.id,
    code: s.code,
    title: s.title,
    purpose: s.purpose,
    category: s.category ?? t("m.docs.uncategorised", undefined, "General"),
    mustRead: s.must_read,
    acked: acked.has(s.id),
  }));

  return (
    <KnowledgeView
      rows={rows}
      eyebrow={t("m.docs.eyebrow", { count: rows.length }, `${rows.length} Articles`)}
      title={t("m.docs.title", undefined, "Knowledge")}
    />
  );
}
