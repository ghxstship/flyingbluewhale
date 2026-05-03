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
  if (Array.isArray(raw)) return raw.filter((t): t is string => typeof t === "string");
  return [];
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Knowledge" title="Article" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
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
        eyebrow="Knowledge"
        title={article.title}
        subtitle={
          <span className="font-mono text-xs">
            /{article.slug} · v{article.version} · updated {timeAgo(article.updated_at)}
          </span>
        }
        breadcrumbs={[{ label: "Knowledge", href: "/console/knowledge" }, { label: article.title }]}
        action={
          <Button href={`/console/kb/${article.id}/edit`} size="sm" variant="secondary">
            Edit
          </Button>
        }
      />
      <div className="page-content max-w-3xl space-y-5">
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <Link key={t} href={`/console/knowledge?tag=${encodeURIComponent(t)}`}>
                <Badge variant="muted">{t}</Badge>
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
