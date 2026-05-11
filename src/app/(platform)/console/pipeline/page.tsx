import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { PipelineKanban } from "./PipelineKanban";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader eyebrow="Console" title="Pipeline" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );

  const session = await requireSession();
  const leads = await listOrgScoped("leads", session.orgId, {
    orderBy: "updated_at",
    ascending: false,
    limit: 500,
  });

  return (
    <>
      <ModuleHeader
        eyebrow="Sales"
        title="Pipeline"
        subtitle={`${leads.length} lead${leads.length === 1 ? "" : "s"}`}
        action={
          <Button href="/console/pipeline/new" size="sm">
            + New Lead
          </Button>
        }
      />
      <PipelineKanban leads={leads} />
    </>
  );
}
