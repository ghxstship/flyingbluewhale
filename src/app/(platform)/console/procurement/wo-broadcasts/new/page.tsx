import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { createBroadcast } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--text-secondary)]";

export default async function Page() {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const { t } = await getRequestT();
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .eq("org_id", session.orgId)
    .order("name");

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.woBroadcasts.new.eyebrow", undefined, "Procurement")}
        title={t("console.procurement.woBroadcasts.new.title", undefined, "New WO broadcast")}
        subtitle={t(
          "console.procurement.woBroadcasts.new.subtitle",
          undefined,
          "Post an open work order to the vendor pool.",
        )}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createBroadcast}
          cancelHref="/console/procurement/wo-broadcasts"
          submitLabel={t("console.procurement.woBroadcasts.new.submitLabel", undefined, "Save Draft")}
        >
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              {t("console.procurement.woBroadcasts.new.fields.title", undefined, "Title")}
              <span className="ms-0.5 text-[var(--color-error)]">*</span>
            </span>
            <input
              name="title"
              required
              placeholder={t(
                "console.procurement.woBroadcasts.new.fields.titlePlaceholder",
                undefined,
                "Need extra forklift + driver, 2 hours, downstage",
              )}
              className={INPUT}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              {t("console.procurement.woBroadcasts.new.fields.description", undefined, "Description")}
            </span>
            <textarea name="description" rows={3} className={INPUT} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.procurement.woBroadcasts.new.fields.project", undefined, "Project")}
              </span>
              <select name="project_id" className={INPUT}>
                <option value="">—</option>
                {(projects ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.procurement.woBroadcasts.new.fields.category", undefined, "Category")}
              </span>
              <input
                name="category"
                placeholder={t(
                  "console.procurement.woBroadcasts.new.fields.categoryPlaceholder",
                  undefined,
                  "logistics / security / AV / catering",
                )}
                className={INPUT}
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.procurement.woBroadcasts.new.fields.budget", undefined, "Budget ($)")}
              </span>
              <input type="number" step="any" name="budget" className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.procurement.woBroadcasts.new.fields.neededBy", undefined, "Needed by")}
              </span>
              <input type="datetime-local" name="needed_by" className={INPUT} />
            </label>
          </div>
        </FormShell>
      </div>
    </>
  );
}
