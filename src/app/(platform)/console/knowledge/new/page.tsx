import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createKnowledgeArticleAction } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader
        eyebrow="Knowledge"
        title="New Article"
        breadcrumbs={[{ label: "Knowledge", href: "/console/knowledge" }, { label: "New" }]}
      />
      <div className="page-content max-w-2xl">
        <FormShell action={createKnowledgeArticleAction} cancelHref="/console/knowledge" submitLabel="Publish Article">
          <Input
            label="Slug"
            name="slug"
            required
            maxLength={120}
            placeholder="event-setup-checklist"
            hint="Lowercase, dashes ok. Used in the URL: /console/knowledge/<slug>."
          />
          <Input label="Title" name="title" required maxLength={200} />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Body (Markdown)</label>
            <textarea
              name="body_markdown"
              rows={18}
              required
              maxLength={50_000}
              className="input-base mt-1.5 w-full font-mono text-xs"
              placeholder="# Heading&#10;&#10;Body paragraph. Lists, **bold**, *italic*, `inline code`, [links](https://example.com), and ```code``` fences supported."
            />
          </div>
          <Input
            label="Tags"
            name="tags"
            hint="Comma-separated. Used by /console/knowledge tag filter and by portal pages that pull articles by tag."
          />
        </FormShell>
      </div>
    </>
  );
}
