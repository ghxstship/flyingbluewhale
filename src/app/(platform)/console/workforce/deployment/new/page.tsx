import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { createDeployment } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabase) return notFound();
  const { t } = await getRequestT();
  const session = await requireSession();
  const venues = (await listOrgScoped("venues", session.orgId, {
    orderBy: "name",
    ascending: true,
    limit: 500,
  })) as Array<{ id: string; name: string }>;

  if (venues.length === 0) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.workforce.deployment.new.eyebrow", undefined, "Workforce · Deployment")}
          title={t("console.workforce.deployment.new.title", undefined, "New Deployment")}
        />
        <div className="page-content max-w-xl">
          <div className="surface space-y-3 p-6 text-sm">
            <p>
              {t(
                "console.workforce.deployment.new.needVenue",
                undefined,
                "You need at least one venue before you can plan deployment.",
              )}
            </p>
            <Button href="/console/venues/new" size="sm">
              {t("console.workforce.deployment.new.createVenue", undefined, "+ Create venue")}
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.deployment.new.eyebrow", undefined, "Workforce · Deployment")}
        title={t("console.workforce.deployment.new.title", undefined, "New Deployment")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createDeployment}
          cancelHref="/console/workforce/deployment"
          submitLabel={t("console.workforce.deployment.new.submit", undefined, "Plan Deployment")}
        >
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.workforce.deployment.new.venueLabel", undefined, "Venue")}
            </label>
            <select name="venue_id" className="ps-input mt-1.5 w-full" required>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label={t("console.workforce.deployment.new.functionalAreaLabel", undefined, "Functional Area")}
            name="functional_area"
            maxLength={120}
            placeholder={t(
              "console.workforce.deployment.new.functionalAreaPlaceholder",
              undefined,
              "e.g. Stewarding, Catering, Tech",
            )}
          />
          <Input
            label={t("console.workforce.deployment.new.plannedFteLabel", undefined, "Planned FTE")}
            name="planned_fte"
            type="number"
            min={0}
            step="0.1"
            defaultValue={0}
            required
          />
          <Input
            label={t("console.workforce.deployment.new.actualFteLabel", undefined, "Actual FTE")}
            name="actual_fte"
            type="number"
            min={0}
            step="0.1"
            defaultValue={0}
          />
        </FormShell>
      </div>
    </>
  );
}
