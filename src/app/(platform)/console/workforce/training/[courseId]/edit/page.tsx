import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateTrainingCourse, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ courseId: string }> }) {
  const { t } = await getRequestT();
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
  const fallbackTitle = t("console.workforce.training.edit.fallbackTitle", undefined, "Training course");
  const courseTitle = ((row as Record<string, unknown>)["title"] as string | undefined) ?? fallbackTitle;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.training.edit.eyebrow", undefined, "Training Course")}
        title={t("console.workforce.training.edit.title", { title: courseTitle }, `Edit ${courseTitle}`)}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/workforce/training/${p.courseId}`}
          submitLabel={t("console.workforce.training.edit.submit", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.workforce.training.edit.fields.title", undefined, "Title")}
            name="title"
            defaultValue={row.title ?? ""}
            required
            maxLength={200}
          />
          <Input
            label={t("console.workforce.training.edit.fields.slug", undefined, "Slug")}
            name="slug"
            defaultValue={row.slug ?? ""}
            required
            maxLength={160}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {t("console.workforce.training.edit.fields.body", undefined, "Body (markdown)")}
            </span>
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
