import Link from "next/link";
import { cookies } from "next/headers";
import { getRequestT } from "@/lib/i18n/request";
import { KIOSK_DEVICE_COOKIE } from "@/lib/kiosk/device-token";
import { isKioskAvailable, resolveKioskDevice } from "@/lib/kiosk/server";
import { createServiceClient } from "@/lib/supabase/server";
import { KioskShell } from "./KioskShell";

export const dynamic = "force-dynamic";

/**
 * /m/kiosk — T1-4 shared-device punch mode (Deputy/Homebase pattern).
 *
 * SESSION-LESS: this page lives in the `(kiosk)` route group precisely so the
 * `(mobile)` auth gate never applies. The tablet's identity is its httpOnly
 * device-token cookie (set at /m/kiosk/setup by a manager's own session);
 * every punch then resolves ONE worker via PIN or pass QR, server-side.
 *
 * An unregistered visitor gets a teaching screen, never an error — the first
 * action is always visible (register the device, or set your PIN).
 */
export default async function KioskPage() {
  const { t } = await getRequestT();
  const jar = await cookies();
  const rawToken = jar.get(KIOSK_DEVICE_COOKIE)?.value;

  if (!isKioskAvailable()) {
    return (
      <div className="screen screen-anim">
        <div className="scr-eye">{t("m.kiosk.eyebrow", undefined, "Kiosk")}</div>
        <h1 className="scr-h" style={{ marginBottom: 12 }}>
          {t("m.kiosk.title", undefined, "Time Clock Kiosk")}
        </h1>
        <div className="hint" style={{ padding: "12px 4px" }}>
          {t("m.kiosk.notConfigured", undefined, "Kiosk mode is not configured on this deployment.")}
        </div>
      </div>
    );
  }

  const device = await resolveKioskDevice(rawToken);

  if (!device) {
    return (
      <div className="screen screen-anim">
        <div className="scr-eye">{t("m.kiosk.eyebrow", undefined, "Kiosk")}</div>
        <h1 className="scr-h" style={{ marginBottom: 12 }}>
          {t("m.kiosk.title", undefined, "Time Clock Kiosk")}
        </h1>
        <div className="hint" style={{ padding: "12px 4px", marginBottom: 16 }}>
          {t(
            "m.kiosk.unregisteredBody",
            undefined,
            "This device isn't registered as a punch kiosk yet. A manager signs in once to register it; after that, crew punch in and out here with a PIN or their pass QR. No personal phones needed.",
          )}
        </div>
        <Link href="/m/kiosk/setup" className="ps-btn ps-btn--cta ps-btn--lg" style={{ justifyContent: "center" }}>
          {t("m.kiosk.registerCta", undefined, "Register This Device")}
        </Link>
      </div>
    );
  }

  // Org / project display names for the minimal branding line.
  const supabase = createServiceClient();
  const [{ data: org }, project] = await Promise.all([
    supabase.from("orgs").select("name").eq("id", device.orgId).maybeSingle(),
    device.projectId
      ? supabase.from("projects").select("name").eq("id", device.projectId).is("deleted_at", null).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <KioskShell
      deviceLabel={device.label}
      orgName={(org?.name as string | undefined) ?? "Workspace"}
      projectName={(project?.data?.name as string | undefined) ?? null}
    />
  );
}
