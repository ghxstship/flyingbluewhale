import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateMetric, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ metricId: string }> }) {
  const { metricId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("sustainability_metrics", session.orgId, metricId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  const action = updateMetric.bind(null, metricId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader eyebrow="Sustainability · Carbon" title="Edit Measurement" />
      <div className="page-content max-w-xl">
        <FormShell action={action} cancelHref={`/console/sustainability/carbon/${metricId}`} submitLabel="Save Changes">
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label="Period Start"
            name="period_start"
            type="date"
            defaultValue={dateOnly(r.period_start)}
            required
          />
          <Input label="Period End" name="period_end" type="date" defaultValue={dateOnly(r.period_end)} required />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Scope</label>
            <select name="scope" defaultValue={String(r.scope ?? 1)} className="input-base mt-1.5 w-full">
              <option value="1">Scope 1 — direct</option>
              <option value="2">Scope 2 — purchased energy</option>
              <option value="3">Scope 3 — value chain</option>
            </select>
          </div>
          <Input
            label="kg CO₂e"
            name="kg_co2e"
            type="number"
            min={0}
            step="0.01"
            defaultValue={String(r.kg_co2e ?? 0)}
            required
          />
          <Input label="Source" name="source" maxLength={120} defaultValue={(r.source as string | undefined) ?? ""} />
          <Input label="Method" name="method" maxLength={120} defaultValue={(r.method as string | undefined) ?? ""} />
        </FormShell>
      </div>
    </>
  );
}

function dateOnly(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 10);
}
