import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
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
  const { t } = await getRequestT();

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
        eyebrow={t("console.knowledge.eyebrow", undefined, "Knowledge")}
        title={t("console.knowledge.edit.title", { title: article.title }, `Edit · ${article.title}`)}
        subtitle={t(
          "console.knowledge.edit.subtitle",
          { current: article.version, next: article.version + 1 },
          `v${article.version} on save → v${article.version + 1}. Body is markdown.`,
        )}
        breadcrumbs={[
          { label: t("console.knowledge.eyebrow", undefined, "Knowledge"), href: "/studio/knowledge" },
          { label: article.title, href: `/studio/knowledge/${article.slug}` },
          { label: t("console.knowledge.edit.crumb", undefined, "Edit") },
        ]}
      />
      <div className="page-content max-w-3xl">
        <FormShell
          action={updateKnowledgeArticle}
          cancelHref={`/studio/knowledge/${article.slug}`}
          submitLabel={t("console.knowledge.edit.submit", undefined, "Save Article")}
          dirtyGuard
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={article.updated_at} />
          <input type="hidden" name="_version" defaultValue={article.version} />
          <input type="hidden" name="slug_current" value={article.slug} />
          <Input
            label={t("console.knowledge.edit.fields.title.label", undefined, "Title")}
            name="title"
            defaultValue={article.title}
            required
            maxLength={300}
          />
          <Input
            label={t("console.knowledge.edit.fields.slug.label", undefined, "Slug")}
            name="slug"
            defaultValue={article.slug}
            required
            maxLength={160}
            hint={t(
              "console.knowledge.edit.fields.slug.hint",
              undefined,
              "Lowercase, dashes ok. Used in the URL: /studio/knowledge/<slug>.",
            )}
          />
          <Input
            label={t("console.knowledge.edit.fields.tags.label", undefined, "Tags")}
            name="tags"
            defaultValue={tags}
            hint={t("console.knowledge.edit.fields.tags.hint", undefined, "Comma-separated")}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.knowledge.edit.fields.body.label", undefined, "Body (Markdown)")}
            </span>
            <textarea
              name="body_markdown"
              defaultValue={article.body_markdown}
              rows={22}
              required
              className="ps-input focus-ring w-full font-mono text-sm"
            />
          </label>
        </FormShell>
      </div>
    </>
  );
}
