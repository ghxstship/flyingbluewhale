import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateArticle, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ articleId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("kb_articles", session.orgId, p.articleId);
  if (!row) notFound();
  const action = updateArticle.bind(null, p.articleId) as unknown as (state: State, fd: FormData) => Promise<State>;
  const tags = Array.isArray(row.tags) ? (row.tags as unknown[]).map(String).join(", ") : "";
  return (
    <>
      <ModuleHeader eyebrow="Knowledge Base" title={`Edit ${row.title}`} />
      <div className="page-content max-w-3xl">
        <FormShell action={action} cancelHref={`/console/kb/${p.articleId}`} submitLabel="Save Changes">
          <Input label="Title" name="title" defaultValue={row.title} required maxLength={300} />
          <Input label="Slug" name="slug" defaultValue={row.slug} required maxLength={160} />
          <Input label="Tags (comma-separated)" name="tags" defaultValue={tags} />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Body (markdown)</span>
            <textarea
              name="body_markdown"
              defaultValue={row.body_markdown}
              rows={18}
              required
              className="input-base focus-ring w-full font-mono text-sm"
            />
          </label>
        </FormShell>
      </div>
    </>
  );
}
