import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateTrainingCourse, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ courseId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("kb_articles", session.orgId, p.courseId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  void r;
  const action = updateTrainingCourse.bind(null, p.courseId) as unknown as (
    state: State,
    fd: FormData,
  ) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow="Training Course"
        title={`Edit ${((row as Record<string, unknown>)["title"] as string | undefined) ?? "Training course"}`}
      />
      <div className="page-content max-w-xl">
        <FormShell action={action} cancelHref={`/console/workforce/training/${p.courseId}`} submitLabel="Save Changes">
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input label="Title" name="title" defaultValue={row.title ?? ""} required maxLength={200} />
          <Input label="Slug" name="slug" defaultValue={row.slug ?? ""} required maxLength={160} />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Body (markdown)</span>
            <textarea
              name="body_markdown"
              defaultValue={row.body_markdown ?? ""}
              rows={12}
              required
              className="input-base focus-ring w-full"
            />
          </label>
        </FormShell>
      </div>
    </>
  );
}
