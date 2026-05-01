import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateRisk, type State } from "./actions";

export const dynamic = "force-dynamic";

function dateOnly(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 10);
}

export default async function Page({ params }: { params: Promise<{ riskId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("risks", session.orgId, p.riskId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  void r;
  const action = updateRisk.bind(null, p.riskId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow="Risk"
        title={`Edit ${((row as Record<string, unknown>)["title"] as string | undefined) ?? "Risk"}`}
      />
      <div className="page-content max-w-xl">
        <FormShell action={action} cancelHref={`/console/programs/risk/${p.riskId}`} submitLabel="Save Changes">
          <Input label="Title" name="title" defaultValue={row.title ?? ""} required maxLength={200} />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Description</span>
            <textarea
              name="description"
              defaultValue={row.description ?? ""}
              rows={5}
              className="input-base focus-ring w-full"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Kind</span>
            <select name="kind" defaultValue={row.kind ?? ""} required className="input-base focus-ring w-full">
              <option value="risk">risk</option>
              <option value="assumption">assumption</option>
              <option value="issue">issue</option>
              <option value="dependency">dependency</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Likelihood</span>
            <select
              name="likelihood"
              defaultValue={row.likelihood ?? ""}
              required
              className="input-base focus-ring w-full"
            >
              <option value="rare">rare</option>
              <option value="unlikely">unlikely</option>
              <option value="possible">possible</option>
              <option value="likely">likely</option>
              <option value="almost_certain">almost_certain</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Impact</span>
            <select name="impact" defaultValue={row.impact ?? ""} required className="input-base focus-ring w-full">
              <option value="insignificant">insignificant</option>
              <option value="minor">minor</option>
              <option value="moderate">moderate</option>
              <option value="major">major</option>
              <option value="severe">severe</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Status</span>
            <select name="status" defaultValue={row.status ?? ""} required className="input-base focus-ring w-full">
              <option value="open">open</option>
              <option value="mitigating">mitigating</option>
              <option value="accepted">accepted</option>
              <option value="closed">closed</option>
            </select>
          </label>
          <Input label="Due On" name="due_on" type="date" defaultValue={dateOnly(row.due_on)} />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Treatment</span>
            <textarea
              name="treatment"
              defaultValue={row.treatment ?? ""}
              rows={5}
              className="input-base focus-ring w-full"
            />
          </label>
        </FormShell>
      </div>
    </>
  );
}
