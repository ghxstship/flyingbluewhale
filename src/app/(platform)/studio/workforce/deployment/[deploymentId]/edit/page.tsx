import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateDeployment, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ deploymentId: string }> }) {
  const { deploymentId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("workforce_deployments", session.orgId, deploymentId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  const { t } = await getRequestT();
  const action = updateDeployment.bind(null, deploymentId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.deployment.edit.eyebrow", undefined, "Workforce · Deployment")}
        title={t("console.workforce.deployment.edit.title", undefined, "Edit Deployment")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/studio/workforce/deployment/${deploymentId}`}
          submitLabel={t("console.workforce.deployment.edit.submit", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.workforce.deployment.edit.functionalArea", undefined, "Functional Area")}
            name="functional_area"
            maxLength={120}
            defaultValue={(r.functional_area as string | undefined) ?? ""}
          />
          <Input
            label={t("console.workforce.deployment.edit.plannedFte", undefined, "Planned FTE")}
            name="planned_fte"
            type="number"
            min={0}
            step="0.1"
            defaultValue={String(r.planned_fte ?? 0)}
            required
          />
          <Input
            label={t("console.workforce.deployment.edit.actualFte", undefined, "Actual FTE")}
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
