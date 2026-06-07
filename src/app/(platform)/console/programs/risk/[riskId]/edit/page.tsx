import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateRisk, type State } from "./actions";

export const dynamic = "force-dynamic";

function dateOnly(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 10);
}

export default async function Page({ params }: { params: Promise<{ riskId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const { t } = await getRequestT();
  const session = await requireSession();
  const row = await getOrgScoped("risks", session.orgId, p.riskId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  void r;
  const action = updateRisk.bind(null, p.riskId) as unknown as (state: State, fd: FormData) => Promise<State>;
  const rowTitle =
    ((row as Record<string, unknown>)["title"] as string | undefined) ??
    t("console.programs.risk.edit.fallbackTitle", undefined, "Risk");
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.programs.risk.edit.eyebrow", undefined, "Risk")}
        title={t("console.programs.risk.edit.title", { name: rowTitle }, `Edit ${rowTitle}`)}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/programs/risk/${p.riskId}`}
          submitLabel={t("common.saveChanges", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.programs.risk.edit.fields.title", undefined, "Title")}
            name="title"
            defaultValue={row.title ?? ""}
            required
            maxLength={200}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.programs.risk.edit.fields.description", undefined, "Description")}
            </span>
            <textarea
              name="description"
              defaultValue={row.description ?? ""}
              rows={5}
              className="ps-input focus-ring w-full"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.programs.risk.edit.fields.kind", undefined, "Kind")}
            </span>
            <select name="kind" defaultValue={row.kind ?? ""} required className="ps-input focus-ring w-full">
              <option value="risk">risk</option>
              <option value="assumption">assumption</option>
              <option value="issue">issue</option>
              <option value="dependency">dependency</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.programs.risk.edit.fields.likelihood", undefined, "Likelihood")}
            </span>
            <select
              name="likelihood"
              defaultValue={row.likelihood ?? ""}
              required
              className="ps-input focus-ring w-full"
            >
              <option value="rare">rare</option>
              <option value="unlikely">unlikely</option>
              <option value="possible">possible</option>
              <option value="likely">likely</option>
              <option value="almost_certain">almost_certain</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.programs.risk.edit.fields.impact", undefined, "Impact")}
            </span>
            <select name="impact" defaultValue={row.impact ?? ""} required className="ps-input focus-ring w-full">
              <option value="insignificant">insignificant</option>
              <option value="minor">minor</option>
              <option value="moderate">moderate</option>
              <option value="major">major</option>
              <option value="severe">severe</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.programs.risk.edit.fields.status", undefined, "Status")}
            </span>
            <select name="status" defaultValue={row.status ?? ""} required className="ps-input focus-ring w-full">
              <option value="open">open</option>
              <option value="mitigating">mitigating</option>
              <option value="accepted">accepted</option>
              <option value="closed">closed</option>
            </select>
          </label>
          <Input
            label={t("console.programs.risk.edit.fields.dueOn", undefined, "Due On")}
            name="due_on"
            type="date"
            defaultValue={dateOnly(row.due_on)}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.programs.risk.edit.fields.treatment", undefined, "Treatment")}
            </span>
            <textarea
              name="treatment"
              defaultValue={row.treatment ?? ""}
              rows={5}
              className="ps-input focus-ring w-full"
            />
          </label>
        </FormShell>
      </div>
    </>
  );
}
