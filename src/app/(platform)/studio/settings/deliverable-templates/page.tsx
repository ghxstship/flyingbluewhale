export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { can, isManagerPlus, requireSession } from "@/lib/auth";
import { getRequestT } from "@/lib/i18n/request";
import { createClient } from "@/lib/supabase/server";
import { Constants } from "@/lib/supabase/database.types";
import { toTitle } from "@/lib/format";
import { archiveDeliverableTemplateAction, createDeliverableTemplateAction } from "./actions";

/**
 * Deliverable-template management (template-management program, 2026-07-24).
 * The advancing doc-spec seeds finally get an org surface: list (org rows +
 * global seeds), inline create, archive. The LEG3ND library's deliverable
 * family deep-links here.
 */
export default async function DeliverableTemplatesPage() {
  const session = await requireSession();
  const { t } = await getRequestT();
  const supabase = await createClient();
  const { data } = await supabase
    .from("deliverable_templates")
    .select("id, org_id, name, type, description, is_global, updated_at")
    .is("deleted_at", null)
    .order("is_global", { ascending: false })
    .order("name", { ascending: true })
    .limit(300);
  const rows = data ?? [];
  const canManage = isManagerPlus(session) || can(session, "templates:write");

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.settings.deliverableTemplates.eyebrow", undefined, "Settings")}
        title={t("console.settings.deliverableTemplates.title", undefined, "Deliverable Templates")}
        subtitle={t(
          "console.settings.deliverableTemplates.subtitle",
          undefined,
          "Doc-spec seeds applied inside a project's advancing workflow.",
        )}
      />
      <div className="page-content max-w-5xl space-y-6">
        {rows.length === 0 ? (
          <p className="text-sm text-[var(--p-text-2)]">
            {t(
              "console.settings.deliverableTemplates.empty",
              undefined,
              "No deliverable templates yet. Create the first one below.",
            )}
          </p>
        ) : (
          <table className="ps-table w-full">
            <thead>
              <tr>
                <th>{t("console.settings.deliverableTemplates.col.name", undefined, "Name")}</th>
                <th>{t("console.settings.deliverableTemplates.col.type", undefined, "Type")}</th>
                <th>{t("console.settings.deliverableTemplates.col.scope", undefined, "Scope")}</th>
                <th>{t("console.settings.deliverableTemplates.col.description", undefined, "Description")}</th>
                {canManage && <th />}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="font-medium">{r.name}</td>
                  <td className="ps-id">{r.type}</td>
                  <td>
                    {r.is_global ? (
                      <Badge variant="muted">
                        {t("console.settings.deliverableTemplates.scopeGlobal", undefined, "Global")}
                      </Badge>
                    ) : (
                      <Badge variant="brand">
                        {t("console.settings.deliverableTemplates.scopeOrg", undefined, "Org")}
                      </Badge>
                    )}
                  </td>
                  <td className="max-w-md text-sm text-[var(--p-text-2)]">{r.description}</td>
                  {canManage && (
                    <td className="text-right">
                      {r.org_id === session.orgId && (
                        <form
                          action={async () => {
                            "use server";
                            const res = await archiveDeliverableTemplateAction(r.id);
                            if (res.error) throw new Error(res.error);
                          }}
                        >
                          <Button type="submit" variant="secondary">
                            {t("console.settings.deliverableTemplates.archive", undefined, "Archive")}
                          </Button>
                        </form>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {canManage && (
          <div className="surface max-w-2xl p-5">
            <h2 className="text-sm font-semibold">
              {t("console.settings.deliverableTemplates.newHeading", undefined, "New Deliverable Template")}
            </h2>
            <div className="mt-3">
              <FormShell
                action={createDeliverableTemplateAction}
                submitLabel={t("console.settings.deliverableTemplates.submit", undefined, "Create Template")}
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    label={t("console.settings.deliverableTemplates.name.label", undefined, "Name")}
                    name="name"
                    required
                    maxLength={200}
                  />
                  <div>
                    <label htmlFor="type" className="text-xs font-medium text-[var(--p-text-2)]">
                      {t("console.settings.deliverableTemplates.type.label", undefined, "Deliverable type")}{" "}
                      <span className="text-[var(--p-danger)]">*</span>
                    </label>
                    <select id="type" name="type" required defaultValue="custom" className="ps-input mt-1.5 w-full">
                      {Constants.public.Enums.deliverable_type.map((v) => (
                        <option key={v} value={v}>
                          {toTitle(v.replace(/_/g, " "))}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <Input
                  label={t("console.settings.deliverableTemplates.description.label", undefined, "Description")}
                  name="description"
                  maxLength={2000}
                />
              </FormShell>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
