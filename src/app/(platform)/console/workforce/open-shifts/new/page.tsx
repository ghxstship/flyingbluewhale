import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { createListingAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { t } = await getRequestT();

  let projects: Array<{ id: string; name: string }> = [];
  if (hasSupabase) {
    const session = await requireSession();
    const supabase = await createClient();
    const { data } = await supabase
      .from("projects")
      .select("id, name")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("name")
      .limit(200);
    projects = (data ?? []) as Array<{ id: string; name: string }>;
  }

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.openShifts.eyebrow", undefined, "Workforce")}
        title={t("console.workforce.openShifts.new.title", undefined, "Post Open Shift")}
        breadcrumbs={[{ label: "Open Shifts", href: "/console/workforce/open-shifts" }]}
      />
      <div className="page-content">
        <div className="surface max-w-xl p-6">
          <FormShell action={createListingAction}>
            <div className="space-y-4">
              <Input
                name="title"
                label={t("console.workforce.openShifts.field.title", undefined, "Shift title")}
                placeholder="Front-of-house crew — Load In Day"
                required
              />
              <Input
                name="role"
                label={t("console.workforce.openShifts.field.role", undefined, "Role")}
                placeholder="Stage Hand"
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  name="starts_at"
                  label={t("console.workforce.openShifts.field.startsAt", undefined, "Starts at")}
                  type="datetime-local"
                  required
                />
                <Input
                  name="ends_at"
                  label={t("console.workforce.openShifts.field.endsAt", undefined, "Ends at")}
                  type="datetime-local"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  name="venue"
                  label={t("console.workforce.openShifts.field.venue", undefined, "Venue")}
                  placeholder="Main Stage"
                />
                <Input
                  name="event_date"
                  label={t("console.workforce.openShifts.field.eventDate", undefined, "Event date")}
                  type="date"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  name="pay_rate"
                  label={t("console.workforce.openShifts.field.payRate", undefined, "Pay rate")}
                  placeholder="250"
                  type="number"
                  min="0"
                />
                <Input
                  name="max_claims"
                  label={t("console.workforce.openShifts.field.maxClaims", undefined, "Slots available")}
                  type="number"
                  min="1"
                  defaultValue="1"
                />
              </div>
              <Input
                name="skills_required"
                label={t("console.workforce.openShifts.field.skills", undefined, "Required skills (comma-separated)")}
                placeholder="Rigging, Forklift, First Aid"
              />
              {projects.length > 0 && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">
                    {t("console.workforce.openShifts.field.project", undefined, "Link to project (optional)")}
                  </label>
                  <select name="project_id" className="input">
                    <option value="">— None —</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[var(--text-secondary)]">
                  {t("console.workforce.openShifts.field.notes", undefined, "Notes")}
                </label>
                <textarea name="notes" rows={3} className="input resize-none" placeholder="Any additional details..." />
              </div>
              <div className="pt-2">
                <button type="submit" className="btn btn-primary w-full">
                  {t("console.workforce.openShifts.new.submit", undefined, "Post Shift")}
                </button>
              </div>
            </div>
          </FormShell>
        </div>
      </div>
    </>
  );
}
