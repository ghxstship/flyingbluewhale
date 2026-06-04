import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import { Markdown } from "@/components/Markdown";
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
  created_at: string;
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
    .select("id, slug, title, body_markdown, tags, version, updated_at, created_at")
    .eq("slug", slug)
    .eq("org_id", session.orgId)
    .maybeSingle();

  const article = data as unknown as Article | null;
  if (!article) notFound();

  const tags = tagsOf(article.tags);

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
          { label: t("console.knowledge.eyebrow", undefined, "Knowledge"), href: "/console/knowledge" },
          { label: article.title },
        ]}
        action={
          <Button href={`/console/knowledge/${article.slug}/edit`} size="sm" variant="secondary">
            {t("common.edit", undefined, "Edit")}
          </Button>
        }
      />
      <div className="page-content max-w-3xl space-y-5">
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Link key={tag} href={`/console/knowledge?tag=${encodeURIComponent(tag)}`}>
                <Badge variant="muted">{tag}</Badge>
              </Link>
            ))}
          </div>
        )}

        <article className="surface p-8">
          <Markdown source={article.body_markdown} />
        </article>
      </div>
    </>
  );
}
