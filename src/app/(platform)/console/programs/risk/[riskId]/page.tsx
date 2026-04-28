import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { deleteRisk } from "./edit/actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ riskId: string }> }) {
  const p = await params;
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title="Record" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  const session = await requireSession();
  const row = await getOrgScoped("risks", session.orgId, p.riskId);
  if (!row) notFound();
  const title = (row as Record<string, unknown>)["title"] as string | undefined;
  return (
    <>
      <ModuleHeader
        eyebrow="Record"
        title={title ?? p.riskId}
        action={
          <div className="flex items-center gap-2">
            <Button href="/console/programs/risk" variant="ghost" size="sm">
              Back
            </Button>
            <Button href={`/console/programs/risk/${p.riskId}/edit`} size="sm">
              Edit
            </Button>
            <DeleteForm
              action={deleteRisk.bind(null, p.riskId)}
              confirm={`Delete this record? This cannot be undone.`}
            />
          </div>
        }
      />
      <div className="page-content">
        <dl className="surface grid grid-cols-1 gap-3 p-6 sm:grid-cols-2">
          {Object.entries(row as Record<string, unknown>).map(([k, v]) => (
            <div key={k} className="flex flex-col gap-1">
              <dt className="text-xs tracking-wide text-[var(--muted)] uppercase">{k}</dt>
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
