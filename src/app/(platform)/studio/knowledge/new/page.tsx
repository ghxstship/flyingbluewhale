import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createKnowledgeArticleAction } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.knowledge.new.eyebrow", undefined, "Knowledge")}
        title={t("console.knowledge.new.title", undefined, "New Article")}
        breadcrumbs={[
          { label: t("console.knowledge.new.breadcrumbKnowledge", undefined, "Knowledge"), href: "/studio/knowledge" },
          { label: t("console.knowledge.new.breadcrumbNew", undefined, "New") },
        ]}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createKnowledgeArticleAction}
          cancelHref="/studio/knowledge"
          submitLabel={t("console.knowledge.new.submitLabel", undefined, "Publish Article")}
        >
          <Input
            label={t("console.knowledge.new.slugLabel", undefined, "Slug")}
            name="slug"
            required
            maxLength={120}
            placeholder="event-setup-checklist"
            hint={t(
              "console.knowledge.new.slugHint",
              undefined,
              "Lowercase, dashes ok. Used in the URL: /studio/knowledge/<slug>.",
            )}
          />
          <Input
            label={t("console.knowledge.new.titleLabel", undefined, "Title")}
            name="title"
            required
            maxLength={200}
          />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.knowledge.new.bodyLabel", undefined, "Body — Markdown")}
            </label>
            <textarea
              name="body_markdown"
              rows={18}
              required
              maxLength={50_000}
              className="ps-input mt-1.5 w-full font-mono text-xs"
              placeholder={t(
                "console.knowledge.new.bodyPlaceholder",
                undefined,
                "# Heading\n\nBody paragraph. Lists, **bold**, *italic*, `inline code`, [links](https://example.com), and ```code``` fences supported.",
              )}
            />
          </div>
          <Input
            label={t("console.knowledge.new.tagsLabel", undefined, "Tags")}
            name="tags"
            hint={t(
              "console.knowledge.new.tagsHint",
              undefined,
              "Comma-separated. Used by /studio/knowledge tag filter and by portal pages that pull articles by tag.",
            )}
          />
        </FormShell>
      </div>
    </>
  );
}
