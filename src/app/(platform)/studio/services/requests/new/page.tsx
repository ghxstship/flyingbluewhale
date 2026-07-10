import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { createServiceRequest } from "../actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.services.requests.new.eyebrow", undefined, "Services")}
          title={t("console.services.requests.new.title", undefined, "Open Service Request")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.services.requests.new.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const [projects, venues] = await Promise.all([
    listOrgScoped("projects", session.orgId, { orderBy: "name", ascending: true, limit: 200 }) as Promise<
      Array<{ id: string; name: string }>
    >,
    listOrgScoped("venues", session.orgId, { orderBy: "name", ascending: true, limit: 200 }) as Promise<
      Array<{ id: string; name: string }>
    >,
  ]);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.services.requests.new.eyebrow", undefined, "Services")}
        title={t("console.services.requests.new.title", undefined, "Open Service Request")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createServiceRequest}
          cancelHref="/studio/services/requests"
          submitLabel={t("console.services.requests.new.submit", undefined, "Open Request")}
        >
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.services.requests.new.categoryLabel", undefined, "Category")}
            </label>
            <select name="category" defaultValue="AV" className="ps-input mt-1.5 w-full" required>
              <option value="AV">{t("console.services.requests.new.categoryAV", undefined, "AV")}</option>
              <option value="cleaning">
                {t("console.services.requests.new.categoryCleaning", undefined, "Cleaning")}
              </option>
              <option value="repair">{t("console.services.requests.new.categoryRepair", undefined, "Repair")}</option>
              <option value="IT">{t("console.services.requests.new.categoryIT", undefined, "IT")}</option>
              <option value="hospitality">
                {t("console.services.requests.new.categoryHospitality", undefined, "Hospitality")}
              </option>
              <option value="security">
                {t("console.services.requests.new.categorySecurity", undefined, "Security")}
              </option>
              <option value="other">{t("console.services.requests.new.categoryOther", undefined, "Other")}</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.services.requests.new.severityLabel", undefined, "Severity")}
            </label>
            <select name="severity" defaultValue="P3" className="ps-input mt-1.5 w-full" required>
              <option value="P1">
                {t(
                  "console.services.requests.new.severityP1",
                  undefined,
                  "P1 · live-event blocker (5m ack, 1h resolve)",
                )}
              </option>
              <option value="P2">
                {t("console.services.requests.new.severityP2", undefined, "P2 · Urgent · 15m Ack, 4h Resolve")}
              </option>
              <option value="P3">
                {t("console.services.requests.new.severityP3", undefined, "P3 · Standard · 1h Ack, 1d Resolve")}
              </option>
              <option value="P4">
                {t("console.services.requests.new.severityP4", undefined, "P4 · Low · 4h Ack, 3d Resolve")}
              </option>
            </select>
          </div>
          <Input
            label={t("console.services.requests.new.summaryLabel", undefined, "Summary")}
            name="summary"
            maxLength={200}
            placeholder={t("console.services.requests.new.summaryPlaceholder", undefined, "One-line description")}
            required
          />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.services.requests.new.descriptionLabel", undefined, "Description")}
            </label>
            <textarea name="description" rows={4} maxLength={4000} className="ps-input mt-1.5 w-full" />
          </div>
          {projects.length > 0 && (
            <div>
              <label className="text-xs font-medium text-[var(--p-text-2)]">
                {t("console.services.requests.new.projectLabel", undefined, "Project · Optional")}
              </label>
              <select name="project_id" defaultValue="" className="ps-input mt-1.5 w-full">
                <option value="">{t("console.services.requests.new.noneOption", undefined, "none")}</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {venues.length > 0 && (
            <div>
              <label className="text-xs font-medium text-[var(--p-text-2)]">
                {t("console.services.requests.new.venueLabel", undefined, "Venue · Optional")}
              </label>
              <select name="venue_id" defaultValue="" className="ps-input mt-1.5 w-full">
                <option value="">{t("console.services.requests.new.noneOption", undefined, "none")}</option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </FormShell>
      </div>
    </>
  );
}
