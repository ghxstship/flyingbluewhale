import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { DeleteForm } from "@/components/DeleteForm";
import { deletePolicy } from "./edit/actions";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ policyId: string }> }) {
  const p = await params;
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title="Insurance Policy" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  const session = await requireSession();
  const row = await getOrgScoped("insurance_policies", session.orgId, p.policyId);
  if (!row) notFound();
  const fields = row as Record<string, unknown>;
  const title = (fields["policy_no"] as string | undefined) ?? (fields["carrier"] as string | undefined) ?? p.policyId;
  return (
    <>
      <ModuleHeader
        eyebrow="Legal · Insurance"
        title={title}
        action={
          <div className="flex items-center gap-2">
            <Button href="/console/legal/insurance" variant="ghost" size="sm">
              Back
            </Button>
            <Button href={`/console/legal/insurance/${p.policyId}/edit`} size="sm">
              Edit
            </Button>
            <DeleteForm
              action={deletePolicy.bind(null, p.policyId)}
              confirm={`Delete policy "${title}"? This cannot be undone.`}
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
