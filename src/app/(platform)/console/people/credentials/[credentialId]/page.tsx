import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { DeleteForm } from "@/components/DeleteForm";
import { deleteCredential } from "./edit/actions";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ credentialId: string }> }) {
  const p = await params;
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title="Credential" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  const session = await requireSession();
  const row = await getOrgScoped("credentials", session.orgId, p.credentialId);
  if (!row) notFound();
  const fields = row as Record<string, unknown>;
  const title = (fields["kind"] as string | undefined) ?? p.credentialId;
  return (
    <>
      <ModuleHeader
        eyebrow="People · Credential"
        title={title}
        action={
          <div className="flex items-center gap-2">
            <Button href="/console/people/credentials" variant="ghost" size="sm">
              Back
            </Button>
            <Button href={`/console/people/credentials/${p.credentialId}/edit`} size="sm">
              Edit
            </Button>
            <DeleteForm
              action={deleteCredential.bind(null, p.credentialId)}
              confirm={`Delete credential "${title}"? This cannot be undone.`}
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
