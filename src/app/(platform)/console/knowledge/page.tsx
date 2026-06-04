import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Article = {
  id: string;
  slug: string;
  title: string;
  body_markdown: string;
  tags: string[] | null;
  version: number;
  updated_at: string;
};

function tagsOf(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((tag): tag is string => typeof tag === "string");
  return [];
}

function preview(body: string): string {
  const stripped = body
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^#{1,6}\s.*$/gm, "")
    .replace(/[*_`#>-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.length > 180 ? stripped.slice(0, 180) + "…" : stripped;
}

export default async function Page({ searchParams }: { searchParams: Promise<{ tag?: string }> }) {
  const sp = await searchParams;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.knowledge.eyebrow", undefined, "Knowledge")}
          title={t("console.knowledge.title", undefined, "Knowledge Base")}
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

  let q = supabase
    .from("kb_articles")
    .select("id, slug, title, body_markdown, tags, version, updated_at")
    .eq("org_id", session.orgId)
    .order("updated_at", { ascending: false })
    .limit(200);

  const { data } = await q;
  let rows = (data ?? []).map((r) => ({
    ...r,
    tags: tagsOf((r as { tags?: unknown }).tags),
  })) as Article[];

  if (sp.tag) {
    rows = rows.filter((r) => r.tags?.includes(sp.tag!));
  }

  const allTags = Array.from(new Set(rows.flatMap((r) => r.tags ?? []))).sort();

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.knowledge.eyebrow", undefined, "Knowledge")}
        title={t("console.knowledge.title", undefined, "Knowledge Base")}
        subtitle={
          sp.tag
            ? rows.length === 1
              ? t("console.knowledge.subtitleTaggedOne", { tag: sp.tag }, `${rows.length} article tagged "${sp.tag}"`)
              : t(
                  "console.knowledge.subtitleTaggedMany",
                  { count: rows.length, tag: sp.tag },
                  `${rows.length} articles tagged "${sp.tag}"`,
                )
            : rows.length === 1
              ? t("console.knowledge.subtitleOne", undefined, `${rows.length} article`)
              : t("console.knowledge.subtitleMany", { count: rows.length }, `${rows.length} articles`)
        }
        action={
          <Button href="/console/knowledge/new" size="sm">
            {t("console.knowledge.newArticle", undefined, "+ New Article")}
          </Button>
        }
      />
      <div className="page-content space-y-4">
        {allTags.length > 0 && (
          <div className="surface p-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <Link
                href="/console/knowledge"
                className="hover-lift rounded border border-[var(--border-color)] px-2 py-1 text-xs"
              >
                {t("console.knowledge.filterAll", undefined, "All")}
              </Link>
              {allTags.map((tag) => (
                <Link
                  key={tag}
                  href={`/console/knowledge?tag=${encodeURIComponent(tag)}`}
                  className={`hover-lift rounded border border-[var(--border-color)] px-2 py-1 text-xs ${
                    sp.tag === tag ? "bg-[var(--surface-inset)] font-semibold" : ""
                  }`}
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {rows.length === 0 ? (
          <div className="surface">
            <EmptyState
              size="compact"
              title={
                sp.tag
                  ? t("console.knowledge.emptyTitleTagged", { tag: sp.tag }, `No articles tagged "${sp.tag}"`)
                  : t("console.knowledge.emptyTitle", undefined, "No articles yet")
              }
              description={t(
                "console.knowledge.emptyDescription",
                undefined,
                "Knowledge articles render markdown bodies and can be filtered by tag. Create one to get started.",
              )}
              action={
                <Button href="/console/knowledge/new" size="sm">
                  {t("console.knowledge.createFirstArticle", undefined, "+ Create first article")}
                </Button>
              }
            />
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((a) => (
              <li key={a.id} className="surface hover-lift p-4">
                <Link href={`/console/knowledge/${a.slug}`} className="block">
                  <div className="font-mono text-[10px] tracking-wider text-[var(--text-muted)] uppercase">
                    /{a.slug} · v{a.version}
                  </div>
                  <h3 className="mt-1 text-base font-semibold">{a.title}</h3>
                  <p className="mt-2 line-clamp-3 text-xs text-[var(--text-secondary)]">{preview(a.body_markdown)}</p>
                  <div className="mt-3 flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                    <div className="flex flex-wrap gap-1">
                      {(a.tags ?? []).slice(0, 4).map((tag) => (
                        <Badge key={tag} variant="muted">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <span>{timeAgo(a.updated_at)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
