import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { DeleteForm } from "@/components/DeleteForm";
import { deleteDeployment } from "./edit/actions";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ deploymentId: string }> }) {
  const p = await params;
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title="Deployment" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  const session = await requireSession();
  const row = await getOrgScoped("workforce_deployments", session.orgId, p.deploymentId);
  if (!row) notFound();
  const fields = row as Record<string, unknown>;
  const title = (fields["functional_area"] as string | undefined) ?? p.deploymentId;
  return (
    <>
      <ModuleHeader
        eyebrow="Workforce · Deployment"
        title={title}
        action={
          <div className="flex items-center gap-2">
            <Button href="/console/workforce/deployment" variant="ghost" size="sm">
              Back
            </Button>
            <Button href={`/console/workforce/deployment/${p.deploymentId}/edit`} size="sm">
              Edit
            </Button>
            <DeleteForm
              action={deleteDeployment.bind(null, p.deploymentId)}
              confirm={`Delete deployment "${title}"? This cannot be undone.`}
            />
          </div>
        }
      />
      <div className="page-content max-w-3xl">
        <dl className="surface grid grid-cols-1 gap-3 p-6 sm:grid-cols-2">
          {Object.entries(fields).map(([k, v]) => (
            <div key={k} className="flex flex-col gap-1">
              <dt className="text-xs tracking-wide text-[var(--text-muted)] uppercase">{toTitle(k)}</dt>
              <dd className="font-mono text-xs break-all">
                {v === null || v === undefined ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}
