import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
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
  const action = updateReadinessExercise.bind(null, p.exerciseId) as unknown as (
    state: State,
    fd: FormData,
  ) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow="Readiness exercise"
        title={`Edit ${((row as Record<string, unknown>)["name"] as string | undefined) ?? "Readiness exercise"}`}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/programs/readiness/${p.exerciseId}`}
          submitLabel="Save changes"
        >
          <Input label="Name" name="name" defaultValue={row.name ?? ""} required maxLength={200} />
          <Input label="Kind" name="kind" defaultValue={row.kind ?? ""} required maxLength={80} />
          <Input
            label="Scheduled at"
            name="scheduled_at"
            type="datetime-local"
            defaultValue={dateTimeLocal(row.scheduled_at)}
          />
        </FormShell>
      </div>
    </>
  );
}
