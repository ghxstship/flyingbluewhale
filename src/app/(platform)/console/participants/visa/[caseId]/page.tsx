import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ caseId: string }> }) {
  const p = await params;
  if (!hasSupabase) return (
    <><ModuleHeader title="Record" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>
  );
  const session = await requireSession();
  const row = await getOrgScoped("visa_cases", session.orgId, p.caseId);
  if (!row) notFound();
  const title = (row as Record<string, unknown>)["person_name"] as string | undefined;
  return (
    <>
      <ModuleHeader eyebrow="Record" title={title ?? p.caseId}
        action={<Button href="/console/participants/visa" variant="ghost">Back</Button>} />
      <div className="page-content">
        <dl className="surface p-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Object.entries(row as Record<string, unknown>).map(([k, v]) => (
            <div key={k} className="flex flex-col gap-1">
              <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">{k}</dt>
              <dd className="font-mono text-xs break-all">{v === null || v === undefined ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}
