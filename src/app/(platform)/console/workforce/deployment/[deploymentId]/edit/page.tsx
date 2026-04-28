import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateDeployment, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ deploymentId: string }> }) {
  const { deploymentId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("workforce_deployments", session.orgId, deploymentId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  const action = updateDeployment.bind(null, deploymentId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader eyebrow="Workforce · Deployment" title="Edit Deployment" />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/workforce/deployment/${deploymentId}`}
          submitLabel="Save changes"
        >
          <Input
            label="Functional Area"
            name="functional_area"
            maxLength={120}
            defaultValue={(r.functional_area as string | undefined) ?? ""}
          />
          <Input
            label="Planned FTE"
            name="planned_fte"
            type="number"
            min={0}
            step="0.1"
            defaultValue={String(r.planned_fte ?? 0)}
            required
          />
          <Input
            label="Actual FTE"
            name="actual_fte"
            type="number"
            min={0}
            step="0.1"
            defaultValue={String(r.actual_fte ?? 0)}
            required
          />
        </FormShell>
      </div>
    </>
  );
}
