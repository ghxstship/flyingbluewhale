import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { updateEstimate, type State } from "./actions";
import { ESTIMATE_STATES } from "@/lib/estimates";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("estimates", session.orgId, id);
  if (!row) notFound();
  const { t } = await getRequestT();
  const action = updateEstimate.bind(null, id) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.estimates.edit.eyebrow", undefined, "Creative")}
        title={t("console.estimates.edit.title", { name: row.name }, `Edit ${row.name}`)}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/studio/estimates/${id}`}
          submitLabel={t("console.estimates.edit.submit", undefined, "Save Changes")}
        >
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.estimates.edit.fields.name", undefined, "Name")}
            name="name"
            defaultValue={row.name}
            required
            maxLength={200}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.estimates.edit.fields.state", undefined, "State")}
            </span>
            <select name="estimate_state" defaultValue={row.estimate_state} className="ps-input focus-ring w-full">
              {ESTIMATE_STATES.map((s) => (
                <option key={s} value={s}>
                  {toTitle(s)}
                </option>
              ))}
            </select>
          </label>
          <Input
            label={t("console.estimates.edit.fields.defaultMarkupPct", undefined, "Default markup %")}
            name="default_markup_pct"
            type="number"
            step="0.0001"
            defaultValue={String(row.default_markup_pct)}
            hint={t("console.estimates.edit.fields.defaultMarkupHint", undefined, "Stored as a fraction (0.07 = 7%).")}
          />
          <Input
            label={t("console.estimates.edit.fields.defaultWasteFactor", undefined, "Default waste factor")}
            name="default_waste_factor"
            type="number"
            step="0.0001"
            defaultValue={String(row.default_waste_factor)}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.estimates.edit.fields.notes", undefined, "Notes")}
            </span>
            <textarea
              name="notes"
              defaultValue={row.notes ?? ""}
              maxLength={4000}
              rows={5}
              className="ps-input focus-ring w-full"
            />
          </label>
        </FormShell>
      </div>
    </>
  );
}
