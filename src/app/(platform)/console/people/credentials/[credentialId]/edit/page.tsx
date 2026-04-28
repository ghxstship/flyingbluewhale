import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateCredential, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ credentialId: string }> }) {
  const { credentialId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("credentials", session.orgId, credentialId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  const action = updateCredential.bind(null, credentialId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader eyebrow="People · Credential" title="Edit Credential" />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/people/credentials/${credentialId}`}
          submitLabel="Save changes"
        >
          <Input label="Kind" name="kind" maxLength={80} defaultValue={(r.kind as string | undefined) ?? ""} required />
          <Input label="Number" name="number" maxLength={120} defaultValue={(r.number as string | undefined) ?? ""} />
          <Input label="Issued On" name="issued_on" type="date" defaultValue={dateOnly(r.issued_on)} />
          <Input label="Expires On" name="expires_on" type="date" defaultValue={dateOnly(r.expires_on)} />
        </FormShell>
      </div>
    </>
  );
}

function dateOnly(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 10);
}
