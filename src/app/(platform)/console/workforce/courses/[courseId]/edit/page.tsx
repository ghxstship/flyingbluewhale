import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateCourseAction, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("courses", session.orgId, courseId);
  if (!row) notFound();
  const { t } = await getRequestT();
  const action = updateCourseAction.bind(null, courseId) as unknown as (
    state: State,
    fd: FormData,
  ) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.courses.edit.eyebrow", undefined, "Course")}
        title={t("console.workforce.courses.edit.title", { title: row.title }, `Edit ${row.title}`)}
        breadcrumbs={[
          { label: t("console.workforce.courses.eyebrow", undefined, "Workforce"), href: "/console/workforce/courses" },
          { label: row.title, href: `/console/workforce/courses/${courseId}` },
          { label: t("console.workforce.courses.edit.crumb", undefined, "Edit") },
        ]}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={action}
          cancelHref={`/console/workforce/courses/${courseId}`}
          submitLabel={t("console.workforce.courses.edit.submit", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.workforce.courses.edit.fields.title", undefined, "Title")}
            name="title"
            defaultValue={row.title}
            required
            maxLength={200}
          />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.workforce.courses.edit.fields.summary", undefined, "Summary")}
            </label>
            <textarea
              name="summary"
              defaultValue={row.summary ?? ""}
              rows={3}
              maxLength={2000}
              className="ps-input mt-1.5 w-full"
            />
          </div>
          <Input
            label={t("console.workforce.courses.edit.fields.duration", undefined, "Duration — Minutes")}
            name="duration_minutes"
            type="number"
            min="1"
            max="600"
            defaultValue={row.duration_minutes ?? ""}
            hint={t(
              "console.workforce.courses.edit.fields.durationHint",
              undefined,
              "Estimate; shown to the assignee on /m/learning.",
            )}
          />
          <Input
            label={t("console.workforce.courses.edit.fields.requiredForRole", undefined, "Required for role")}
            name="required_for_role"
            defaultValue={row.required_for_role ?? ""}
            maxLength={80}
          />
        </FormShell>
      </div>
    </>
  );
}
