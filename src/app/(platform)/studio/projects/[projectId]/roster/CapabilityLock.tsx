import { Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { getRequestT } from "@/lib/i18n/request";

/**
 * Kit 30 permission-denied state — names the capability (`people:manage`)
 * per the clickthrough's lock screen instead of a role band.
 */
export async function CapabilityLock({ capability, backHref }: { capability: string; backHref: string }) {
  const { t } = await getRequestT();
  return (
    <div className="page-content">
      <EmptyState
        icon={<Lock size={32} />}
        title={t("console.projects.roster.lock.title", undefined, "No Access")}
        description={t(
          "console.projects.roster.lock.description",
          { capability },
          `This surface requires the ${capability} capability. Role grants are managed in Settings · Roles.`,
        )}
        action={
          <Button href={backHref} variant="secondary">
            {t("console.projects.roster.lock.back", undefined, "Back To Project")}
          </Button>
        }
      />
    </div>
  );
}
