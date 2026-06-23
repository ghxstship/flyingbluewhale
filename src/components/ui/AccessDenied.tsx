import { Lock } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { getRequestT } from "@/lib/i18n/request";

/**
 * REC-16 / SC-5 — explicit permission-denied surface. Replaces the
 * misleading empty states under-privileged roles used to see on gated
 * console areas. Server component; render it from a layout or page in
 * place of `children` when the session role is below the threshold.
 */
export async function AccessDenied({
  requiredRole,
  backHref = "/studio",
}: {
  /** Human label of the minimum role band, e.g. "Manager" or "Admin". */
  requiredRole: string;
  /** Escape hatch link; defaults to the console overview. */
  backHref?: string;
}) {
  const { t } = await getRequestT();
  return (
    <div className="page-content">
      <EmptyState
        icon={<Lock size={32} />}
        title={t("common.accessDenied.title", undefined, "You Don't Have Access")}
        description={t(
          "common.accessDenied.description",
          { role: requiredRole },
          `This area requires the ${requiredRole} role or above. Ask an org admin if you need access.`,
        )}
        action={
          <Button href={backHref} variant="secondary">
            {t("common.accessDenied.backToOverview", undefined, "Back to Overview")}
          </Button>
        }
      />
    </div>
  );
}
