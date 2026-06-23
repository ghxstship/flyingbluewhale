import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { getRequestT } from "@/lib/i18n/request";
import { AccessControlScanner } from "./AccessControlScanner";

export const dynamic = "force-dynamic";

/**
 * /studio/access-control — console gate/access surface mounting the existing
 * <CameraScanner> primitive (kit v7 §3). Operators verify credential codes at
 * a fixed gate station; decodes are deduped and logged in-session.
 */
export default async function AccessControlPage() {
  await requireSession();
  const { t } = await getRequestT();

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.accessControl.eyebrow", undefined, "Operations")}
        title={t("console.accessControl.title", undefined, "Access Control")}
        subtitle={t("console.accessControl.subtitle", undefined, "Gate credential scanning")}
        breadcrumbs={[{ label: "Operations" }, { label: "Access Control" }]}
      />
      <div className="page-content">
        <AccessControlScanner
          labels={{
            hint: t(
              "console.accessControl.hint",
              undefined,
              "Point a gate camera at a credential's QR or barcode. Each read is verified against live assignments and logged below.",
            ),
            recentTitle: t("console.accessControl.recentTitle", undefined, "Recent scans"),
            recentEmpty: t("console.accessControl.recentEmpty", undefined, "No scans yet"),
            checking: t("console.accessControl.checking", undefined, "Checking…"),
            accepted: t("console.accessControl.accepted", undefined, "Admitted"),
            duplicate: t("console.accessControl.duplicate", undefined, "Already used"),
            voided: t("console.accessControl.voided", undefined, "Voided"),
            expired: t("console.accessControl.expired", undefined, "Expired"),
            unknown: t("console.accessControl.unknown", undefined, "Unknown"),
            error: t("console.accessControl.error", undefined, "Error"),
          }}
        />
      </div>
    </>
  );
}
