import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import { Markdown } from "@/components/Markdown";
import { getRequestT } from "@/lib/i18n/request";
import { kbVerification, isEventSyncable } from "@/lib/kb/verification";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { removeLinkAction, syncArticleFromForm } from "@/app/(platform)/studio/ai/corpus/event-actions";
import { DeleteForm } from "@/components/DeleteForm";
import { VerifyButton } from "./VerifyButton";

export const dynamic = "force-dynamic";

type Article = {
  id: string;
  slug: string;
  title: string;
  body_markdown: string;
  tags: string[] | null;
  version: number;
  updated_at: string;
  created_at: string;
  verified_at: string | null;
  review_interval_days: number;
};

function tagsOf(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((item): item is string => typeof item === "string");
  return [];
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.knowledge.eyebrow", undefined, "Knowledge")}
          title={t("console.knowledge.article.title", undefined, "Article")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.knowledge.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("kb_articles")
    .select("id, slug, title, body_markdown, tags, version, updated_at, created_at, verified_at, review_interval_days")
    .eq("slug", slug)
    .eq("org_id", session.orgId)
    .maybeSingle();

  const article = data as unknown as Article | null;
  if (!article) notFound();

  const tags = tagsOf(article.tags);
  const canVerify = isManagerPlus(session);
  const verification = kbVerification(article.verified_at, article.review_interval_days, Date.now());

  // ── L-P5 event corpus sync: which events this article grounds, + the
  // manager+ sync control. Pre-migration the links select errors → the
  // section degrades to a plain note.
  const loose = supabase as unknown as LooseSupabase;
  const [linksResult, { data: projectRows }] = await Promise.all([
    loose
      .from("project_corpus_links")
      .select("project_id, last_synced_at")
      .eq("org_id", session.orgId)
      .eq("source_type", "kb_article")
      .eq("source_id", article.id),
    loose
      .from("projects")
      .select("id, name")
      .eq("org_id", session.orgId)
      .eq("project_state", "active")
      .is("deleted_at", null)
      .order("name")
      .limit(50),
  ]);
  const syncAvailable = !linksResult.error;
  const articleLinks = (linksResult.data ?? []) as { project_id: string; last_synced_at: string | null }[];
  const activeProjects = (projectRows ?? []) as { id: string; name: string }[];
  const projectNameById = new Map(activeProjects.map((p) => [p.id, p.name]));
  const unsyncedProjects = activeProjects.filter((p) => !articleLinks.some((l) => l.project_id === p.id));
  const syncable = isEventSyncable(verification);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.knowledge.eyebrow", undefined, "Knowledge")}
        title={article.title}
        subtitle={
          <span className="font-mono text-xs">
            /{article.slug} · v{article.version} · {t("console.knowledge.article.updatedPrefix", undefined, "updated")}{" "}
            {timeAgo(article.updated_at)}
          </span>
        }
        breadcrumbs={[
          { label: t("console.knowledge.eyebrow", undefined, "Knowledge"), href: "/studio/knowledge" },
          { label: article.title },
        ]}
        action={
          <div className="flex items-center gap-2">
            {canVerify && (
              <VerifyButton
                articleId={article.id}
                slug={article.slug}
                verified={verification.state !== "unverified"}
                labels={{
                  verify: t("console.knowledge.verify", undefined, "Mark Verified"),
                  unverify: t("console.knowledge.unverify", undefined, "Clear Verified"),
                }}
              />
            )}
            <Button href={`/studio/knowledge/${article.slug}/edit`} size="sm" variant="secondary">
              {t("common.edit", undefined, "Edit")}
            </Button>
          </div>
        }
      />
      <div className="page-content max-w-3xl space-y-5">
        <div className="flex flex-wrap items-center gap-1.5">
          {verification.state === "verified" && (
            <Badge variant="success">
              {t("console.knowledge.verifiedStamp", { when: timeAgo(verification.verifiedAt) }, `Verified ${timeAgo(verification.verifiedAt)}`)}
            </Badge>
          )}
          {verification.state === "stale" && (
            <Badge variant="warning">
              {t("console.knowledge.staleStamp", undefined, "Stale · Review Before Show")}
            </Badge>
          )}
          {tags.map((tag) => (
            <Link key={tag} href={`/studio/knowledge?tag=${encodeURIComponent(tag)}`}>
              <Badge variant="muted">{tag}</Badge>
            </Link>
          ))}
        </div>

        <article className="surface p-8">
          <Markdown source={article.body_markdown} />
        </article>

        {syncAvailable && (
          <section className="surface p-5 space-y-3">
            <div>
              <h2 className="text-sm font-semibold">
                {t("console.knowledge.eventSync.title", undefined, "Event corpus")}
              </h2>
              <p className="text-xs" style={{ color: "var(--p-text-3)" }}>
                {t(
                  "console.knowledge.eventSync.subtitle",
                  undefined,
                  "Events whose grounded answers include this article. The answer at the gate matches this page.",
                )}
              </p>
            </div>

            {articleLinks.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--p-text-3)" }}>
                {t("console.knowledge.eventSync.none", undefined, "Not synced to any event yet.")}
              </p>
            ) : (
              <ul className="space-y-2">
                {articleLinks.map((l) => (
                  <li key={l.project_id} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium">
                      {projectNameById.get(l.project_id) ??
                        t("console.knowledge.eventSync.inactiveProject", undefined, "Inactive event")}
                    </span>
                    <span className="text-xs" style={{ color: "var(--p-text-3)" }}>
                      {l.last_synced_at
                        ? t(
                            "console.knowledge.eventSync.synced",
                            { when: timeAgo(l.last_synced_at) },
                            `Synced ${timeAgo(l.last_synced_at)}`,
                          )
                        : t("console.knowledge.eventSync.notEmbedded", undefined, "Not embedded yet")}
                    </span>
                    {canVerify && (
                      <span className="ml-auto">
                        <DeleteForm
                          action={removeLinkAction.bind(null, l.project_id, "kb_article", article.id)}
                          label={t("console.knowledge.eventSync.remove", undefined, "Remove")}
                          title={t("console.knowledge.eventSync.removeTitle", undefined, "Remove from event corpus")}
                          confirm={t(
                            "console.knowledge.eventSync.removeConfirm",
                            undefined,
                            "Remove this article from the event's grounded answers? The article itself is not deleted.",
                          )}
                        />
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {canVerify &&
              (syncable ? (
                unsyncedProjects.length > 0 && (
                  <form action={syncArticleFromForm} className="flex flex-wrap items-end gap-3">
                    <input type="hidden" name="articleId" value={article.id} />
                    <label className="flex flex-col gap-1 text-xs font-medium">
                      {t("console.knowledge.eventSync.projectLabel", undefined, "Event")}
                      <select name="projectId" className="ps-input" required defaultValue="">
                        <option value="" disabled>
                          {t("console.knowledge.eventSync.projectPlaceholder", undefined, "Choose an event")}
                        </option>
                        {unsyncedProjects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Button type="submit" size="sm">
                      {t("console.knowledge.eventSync.sync", undefined, "Sync to event")}
                    </Button>
                  </form>
                )
              ) : (
                <p className="text-xs" style={{ color: "var(--p-text-3)" }}>
                  {t(
                    "console.knowledge.eventSync.gateNote",
                    undefined,
                    "Only verified articles can be synced to an event. Verify (or re-verify) this article first; a lapsed verification also drops it from event answers until renewed.",
                  )}
                </p>
              ))}
          </section>
        )}
      </div>
    </>
  );
}
