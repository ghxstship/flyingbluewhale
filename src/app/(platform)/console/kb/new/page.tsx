import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createKbArticleAction } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Knowledge" title="New article" />
      <div className="page-content max-w-2xl">
        <FormShell action={createKbArticleAction} cancelHref="/console/kb" submitLabel="Publish article">
          <Input label="Slug" name="slug" required maxLength={120} placeholder="event-setup-checklist" hint="Lowercase, dashes ok. Used in the URL." />
          <Input label="Title" name="title" required maxLength={200} />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Body (Markdown)</label>
            <textarea
              name="body_markdown"
              rows={12}
              required
              maxLength={50_000}
              className="input-base mt-1.5 w-full font-mono text-xs"
            />
          </div>
          <Input label="Tags" name="tags" hint="Comma-separated" />
        </FormShell>
      </div>
    </>
  );
}
