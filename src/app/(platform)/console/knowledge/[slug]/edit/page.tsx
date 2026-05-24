import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { updateKnowledgeArticle } from "./actions";

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

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("kb_articles")
    .select("id, slug, title, body_markdown, tags, version, updated_at")
    .eq("slug", slug)
    .eq("org_id", session.orgId)
    .maybeSingle();

  const article = data as unknown as Article | null;
  if (!article) notFound();

  const tags = Array.isArray(article.tags) ? article.tags.join(", ") : "";

  return (
    <>
      <ModuleHeader
        eyebrow="Knowledge"
        title={`Edit · ${article.title}`}
        subtitle={`v${article.version} on save → v${article.version + 1}. Body is markdown.`}
        breadcrumbs={[
          { label: "Knowledge", href: "/console/knowledge" },
          { label: article.title, href: `/console/knowledge/${article.slug}` },
          { label: "Edit" },
        ]}
      />
      <div className="page-content max-w-3xl">
        <FormShell
          action={updateKnowledgeArticle}
          cancelHref={`/console/knowledge/${article.slug}`}
          submitLabel="Save Article"
          dirtyGuard
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={article.updated_at} />
          <input type="hidden" name="_version" defaultValue={article.version} />
          <input type="hidden" name="slug_current" value={article.slug} />
          <Input label="Title" name="title" defaultValue={article.title} required maxLength={300} />
          <Input
            label="Slug"
            name="slug"
            defaultValue={article.slug}
            required
            maxLength={160}
            hint="Lowercase, dashes ok. Used in the URL: /console/knowledge/<slug>."
          />
          <Input label="Tags" name="tags" defaultValue={tags} hint="Comma-separated" />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Body (markdown)</span>
            <textarea
              name="body_markdown"
              defaultValue={article.body_markdown}
              rows={22}
              required
              className="input-base focus-ring w-full font-mono text-sm"
            />
          </label>
        </FormShell>
      </div>
    </>
  );
}
