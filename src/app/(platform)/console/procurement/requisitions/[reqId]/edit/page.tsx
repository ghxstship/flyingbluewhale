import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateRequisition, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ reqId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("requisitions", session.orgId, p.reqId);
  if (!row) notFound();
  const action = updateRequisition.bind(null, p.reqId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader eyebrow="Requisition" title={`Edit ${row.title}`} />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/procurement/requisitions/${p.reqId}`}
          submitLabel="Save changes"
        >
          <Input label="Title" name="title" defaultValue={row.title} required maxLength={200} />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Description</span>
            <textarea
              name="description"
              defaultValue={row.description ?? ""}
              rows={5}
              maxLength={4000}
              className="input-base focus-ring w-full"
            />
          </label>
          <Input
            label="Estimated (cents)"
            name="estimated_cents"
            type="number"
            defaultValue={row.estimated_cents != null ? String(row.estimated_cents) : ""}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Status</span>
            <select name="status" defaultValue={row.status} required className="input-base focus-ring w-full">
              <option value="draft">draft</option>
              <option value="submitted">submitted</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
              <option value="converted">converted</option>
            </select>
          </label>
        </FormShell>
      </div>
    </>
  );
}
