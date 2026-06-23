import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateReadinessExercise, type State } from "./actions";

export const dynamic = "force-dynamic";

function dateTimeLocal(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 16);
}

export default async function Page({ params }: { params: Promise<{ exerciseId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("readiness_exercises", session.orgId, p.exerciseId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  void r;
  const { t } = await getRequestT();
  const action = updateReadinessExercise.bind(null, p.exerciseId) as unknown as (
    state: State,
    fd: FormData,
  ) => Promise<State>;
  const exerciseName =
    ((row as Record<string, unknown>)["name"] as string | undefined) ??
    t("console.programs.readiness.edit.fallbackName", undefined, "Readiness exercise");
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.programs.readiness.edit.eyebrow", undefined, "Readiness Exercise")}
        title={t("console.programs.readiness.edit.title", { name: exerciseName }, `Edit ${exerciseName}`)}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/studio/programs/readiness/${p.exerciseId}`}
          submitLabel={t("common.saveChanges", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.programs.readiness.edit.nameLabel", undefined, "Name")}
            name="name"
            defaultValue={row.name ?? ""}
            required
            maxLength={200}
          />
          <Input
            label={t("console.programs.readiness.edit.kindLabel", undefined, "Kind")}
            name="kind"
            defaultValue={row.kind ?? ""}
            required
            maxLength={80}
          />
          <Input
            label={t("console.programs.readiness.edit.scheduledAtLabel", undefined, "Scheduled At")}
            name="scheduled_at"
            type="datetime-local"
            defaultValue={dateTimeLocal(row.scheduled_at)}
          />
        </FormShell>
      </div>
    </>
  );
}
