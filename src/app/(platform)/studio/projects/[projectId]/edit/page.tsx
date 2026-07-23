import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { requireSession } from "@/lib/auth";
import { getProject } from "@/lib/db/projects";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateProject, type State } from "./actions";

export const dynamic = "force-dynamic";

function dateOnly(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 10);
}

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const { t } = await getRequestT();
  const [row, clients, venues] = await Promise.all([
    getProject(session.orgId, p.projectId),
    listOrgScoped("clients", session.orgId, { orderBy: "name", ascending: true }),
    listOrgScoped("venues", session.orgId, { orderBy: "name", ascending: true }),
  ]);
  if (!row) notFound();
  const action = updateProject.bind(null, p.projectId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.projects.edit.eyebrow", undefined, "Project")}
        title={t("console.projects.edit.title", { name: row.name }, `Edit ${row.name}`)}
        subtitle={row.slug}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/studio/projects/${p.projectId}`}
          submitLabel={t("console.projects.edit.submit", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.projects.edit.fields.name", undefined, "Name")}
            name="name"
            defaultValue={row.name}
            required
            maxLength={200}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.projects.edit.fields.state", undefined, "Status")}
            </span>
            <select
              name="project_state"
              defaultValue={row.project_state}
              required
              className="ps-input focus-ring w-full"
            >
              <option value="draft">{t("console.projects.edit.state.draft", undefined, "Draft")}</option>
              <option value="active">{t("console.projects.edit.state.active", undefined, "Active")}</option>
              <option value="paused">{t("console.projects.edit.state.paused", undefined, "Paused")}</option>
              <option value="archived">{t("console.projects.edit.state.archived", undefined, "Archived")}</option>
              <option value="complete">{t("console.projects.edit.state.complete", undefined, "Complete")}</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("console.projects.edit.fields.startDate", undefined, "Start Date")}
              name="start_date"
              type="date"
              defaultValue={dateOnly(row.start_date)}
            />
            <Input
              label={t("console.projects.edit.fields.endDate", undefined, "End Date")}
              name="end_date"
              type="date"
              defaultValue={dateOnly(row.end_date)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-[var(--p-text-2)]">
                {t("console.projects.edit.fields.client", undefined, "Client")}
              </span>
              <select name="client_id" defaultValue={row.client_id ?? ""} className="ps-input focus-ring w-full">
                <option value="">{t("console.projects.edit.none", undefined, "None")}</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-[var(--p-text-2)]">
                {t("console.projects.edit.fields.primaryVenue", undefined, "Primary Venue")}
              </span>
              <select
                name="primary_venue_id"
                defaultValue={row.primary_venue_id ?? ""}
                className="ps-input focus-ring w-full"
              >
                <option value="">{t("console.projects.edit.none", undefined, "None")}</option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <MoneyInput
            label={t("console.projects.edit.fields.budget", undefined, "Budget")}
            name="budget_cents"
            defaultCents={row.budget_cents ?? null}
            hint={t("console.projects.edit.fields.budgetHint", undefined, "Dollars. Stored as integer cents.")}
          />
          <div className="grid grid-cols-3 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-[var(--p-text-2)]">
                {t("console.projects.edit.fields.scope", undefined, "Scope")}
              </span>
              <select
                name="geographic_scope"
                defaultValue={row.geographic_scope ?? ""}
                className="ps-input focus-ring w-full"
              >
                <option value="">—</option>
                <option value="local">{t("console.projects.edit.scope.local", undefined, "Local")}</option>
                <option value="regional">{t("console.projects.edit.scope.regional", undefined, "Regional")}</option>
                <option value="national">{t("console.projects.edit.scope.national", undefined, "National")}</option>
                <option value="international">
                  {t("console.projects.edit.scope.international", undefined, "International")}
                </option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-[var(--p-text-2)]">
                {t("console.projects.edit.fields.tourStructure", undefined, "Tour Structure")}
              </span>
              <select
                name="tour_structure"
                defaultValue={row.tour_structure ?? ""}
                className="ps-input focus-ring w-full"
              >
                <option value="">—</option>
                <option value="single_stop">
                  {t("console.projects.edit.tourStructure.singleStop", undefined, "Single Stop")}
                </option>
                <option value="multi_stop_sequential">
                  {t("console.projects.edit.tourStructure.multiStopSequential", undefined, "Multi-Stop Sequential")}
                </option>
                <option value="simultaneous_multi_city">
                  {t("console.projects.edit.tourStructure.simultaneousMultiCity", undefined, "Simultaneous Multi-City")}
                </option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-[var(--p-text-2)]">
                {t("console.projects.edit.fields.productionStyle", undefined, "Production Style")}
              </span>
              <select
                name="production_style"
                defaultValue={row.production_style ?? ""}
                className="ps-input focus-ring w-full"
              >
                <option value="">—</option>
                <option value="editorial">
                  {t("console.projects.edit.productionStyle.editorial", undefined, "Editorial")}
                </option>
                <option value="documentary">
                  {t("console.projects.edit.productionStyle.documentary", undefined, "Documentary")}
                </option>
                <option value="narrative">
                  {t("console.projects.edit.productionStyle.narrative", undefined, "Narrative")}
                </option>
                <option value="spectacle">
                  {t("console.projects.edit.productionStyle.spectacle", undefined, "Spectacle")}
                </option>
                <option value="intimate">
                  {t("console.projects.edit.productionStyle.intimate", undefined, "Intimate")}
                </option>
                <option value="brutalist">
                  {t("console.projects.edit.productionStyle.brutalist", undefined, "Brutalist")}
                </option>
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.projects.edit.fields.description", undefined, "Description")}
            </span>
            <textarea
              name="description"
              defaultValue={row.description ?? ""}
              rows={6}
              maxLength={8000}
              className="ps-input focus-ring w-full"
            />
          </label>
          <p className="text-xs text-[var(--p-text-2)]">
            {t(
              "console.projects.edit.slugNote",
              undefined,
              "Slug is locked after create. Branding lives under the Branding tab.",
            )}
          </p>
        </FormShell>
      </div>
    </>
  );
}
