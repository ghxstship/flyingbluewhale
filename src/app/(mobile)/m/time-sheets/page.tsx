import { requireSession, isManagerPlus } from "@/lib/auth";
import { getRequestT } from "@/lib/i18n/request";
import { EmptyState } from "@/components/ui/EmptyState";
import { TimeSheetsView } from "./TimeSheetsView";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · Workforce Time Sheets (kit 34 v3.7 · §5). Manager review of crew
 * punches → approve/flag → Export to Payroll (the handoff boundary). Distinct
 * from the personal My Timesheets (/m/timesheets).
 *
 * This is a `managerOnly` Workforce-hub member: it self-hides from the crew
 * launcher, and — mirroring the Finance gate — a crew member who deep-links
 * here gets the read-blocked "Manager Access Only" state rather than the full
 * approve/flag/export surface. Capability is not authorization.
 */
export default async function TimeSheetsPage() {
  const session = await requireSession();
  const canManage = isManagerPlus(session);

  if (!canManage) {
    const { t } = await getRequestT();
    return (
      <div className="screen screen-anim">
        <div className="scr-eye">{t("m.timeSheets.eyebrow", undefined, "Workforce")}</div>
        <h1 className="scr-h" style={{ marginBottom: 12 }}>
          {t("m.timeSheets.title", undefined, "Time Sheets")}
        </h1>
        <EmptyState
          size="compact"
          title={t("m.timeSheets.gated.title", undefined, "Manager Access Only")}
          description={t(
            "m.timeSheets.gated.body",
            undefined,
            "Approving crew hours and exporting to payroll is an approvals surface. Ask a manager if you need these.",
          )}
        />
      </div>
    );
  }

  return <TimeSheetsView canManage={canManage} />;
}
