import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
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
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.sustainability.carbon.edit.eyebrow", undefined, "Sustainability · Carbon")}
        title={t("console.sustainability.carbon.edit.title", undefined, "Edit Measurement")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/studio/sustainability/carbon/${metricId}`}
          submitLabel={t("console.sustainability.carbon.edit.submit", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.sustainability.carbon.edit.periodStart", undefined, "Period Start")}
            name="period_start"
            type="date"
            defaultValue={dateOnly(r.period_start)}
            required
          />
          <Input
            label={t("console.sustainability.carbon.edit.periodEnd", undefined, "Period End")}
            name="period_end"
            type="date"
            defaultValue={dateOnly(r.period_end)}
            required
          />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.sustainability.carbon.edit.scope", undefined, "Scope")}
            </label>
            <select name="scope" defaultValue={String(r.scope ?? 1)} className="ps-input mt-1.5 w-full">
              <option value="1">{t("console.sustainability.carbon.edit.scope1", undefined, "Scope 1 (direct)")}</option>
              <option value="2">
                {t("console.sustainability.carbon.edit.scope2", undefined, "Scope 2 (purchased energy)")}
              </option>
              <option value="3">
                {t("console.sustainability.carbon.edit.scope3", undefined, "Scope 3 (value chain)")}
              </option>
            </select>
          </div>
          <Input
            label={t("console.sustainability.carbon.edit.kgCo2e", undefined, "kg CO₂e")}
            name="kg_co2e"
            type="number"
            min={0}
            step="0.01"
            defaultValue={String(r.kg_co2e ?? 0)}
            required
          />
          <Input
            label={t("console.sustainability.carbon.edit.source", undefined, "Source")}
            name="source"
            maxLength={120}
            defaultValue={(r.source as string | undefined) ?? ""}
          />
          <Input
            label={t("console.sustainability.carbon.edit.method", undefined, "Method")}
            name="method"
            maxLength={120}
            defaultValue={(r.method as string | undefined) ?? ""}
          />
        </FormShell>
      </div>
    </>
  );
}

function dateOnly(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 10);
}
