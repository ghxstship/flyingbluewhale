import Link from "next/link";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { createClient } from "@/lib/supabase/server";
import { deactivateKioskDevice } from "./actions";
import { RegisterDeviceForm, type ProjectOption } from "./RegisterDeviceForm";

export const dynamic = "force-dynamic";

/**
 * /m/kiosk/setup — MANAGER-GATED device registration for kiosk mode.
 *
 * The manager signs in on the tablet ONCE, registers it (which plants the
 * long-lived device-token cookie), then signs out — the kiosk never needs
 * their session again. This page also lists the org's registered devices
 * with one-tap revocation, and points workers to /m/kiosk/pin.
 */
export default async function KioskSetupPage() {
  const session = await requireSession("/m/kiosk/setup");
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();

  if (!isManagerPlus(session)) {
    return (
      <div className="screen screen-anim">
        <div className="scr-eye">{t("m.kiosk.eyebrow", undefined, "Kiosk")}</div>
        <h1 className="scr-h" style={{ marginBottom: 12 }}>
          {t("m.kiosk.setup.title", undefined, "Kiosk Setup")}
        </h1>
        <div className="hint" style={{ padding: "12px 4px" }}>
          {t("m.kiosk.setup.managersOnly", undefined, "Registering a kiosk device needs a manager. Ask yours to sign in here once.")}
        </div>
        <Link href="/m/kiosk/pin" className="ps-btn ps-btn--lg" style={{ justifyContent: "center", marginTop: 12 }}>
          {t("m.kiosk.setup.pinLink", undefined, "Set My Punch PIN")}
        </Link>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: projects }, { data: devices }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("kiosk_devices")
      .select("id, label, active, last_seen_at, project_id, projects(name)")
      .eq("org_id", session.orgId)
      .order("created_at", { ascending: false }),
  ]);

  const projectOptions: ProjectOption[] = (projects ?? []).map((p) => ({
    id: p.id as string,
    name: (p.name as string) ?? "Untitled",
  }));

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.kiosk.eyebrow", undefined, "Kiosk")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.kiosk.setup.title", undefined, "Kiosk Setup")}
      </h1>
      <div className="hint" style={{ marginBottom: 16 }}>
        {t(
          "m.kiosk.setup.body",
          undefined,
          "Register THIS tablet as a shared punch kiosk. Crew then clock in and out on it with a PIN or their pass QR. You can sign out after registering; the device keeps working.",
        )}
      </div>

      <RegisterDeviceForm projects={projectOptions} />

      <h2 style={{ marginTop: 24, marginBottom: 8 }}>
        {t("m.kiosk.setup.devicesTitle", undefined, "Registered Devices")}
      </h2>
      {(devices ?? []).length === 0 ? (
        <div className="hint">{t("m.kiosk.setup.devicesEmpty", undefined, "No kiosk devices registered yet.")}</div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
          {(devices ?? []).map((d) => {
            const project = (d.projects as { name?: string } | null)?.name ?? null;
            return (
              <li key={d.id as string} className="ps-card" style={{ padding: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{d.label as string}</div>
                    <div className="hint">
                      {project ?? t("m.kiosk.setup.projectAny", undefined, "Whole workspace")}
                      {" · "}
                      {d.active
                        ? d.last_seen_at
                          ? t(
                              "m.kiosk.setup.lastSeen",
                              { when: fmt.date(d.last_seen_at as string) },
                              "Last seen {when}",
                            )
                          : t("m.kiosk.setup.neverSeen", undefined, "Never used")
                        : t("m.kiosk.setup.deactivated", undefined, "Deactivated")}
                    </div>
                  </div>
                  {Boolean(d.active) && (
                    <form action={deactivateKioskDevice.bind(null, d.id as string)}>
                      <button type="submit" className="ps-btn ps-btn--sm">
                        {t("m.kiosk.setup.deactivate", undefined, "Deactivate")}
                      </button>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div style={{ marginTop: 24 }}>
        <Link href="/m/kiosk/pin" className="ps-btn" style={{ justifyContent: "center", width: "100%" }}>
          {t("m.kiosk.setup.pinLink", undefined, "Set My Punch PIN")}
        </Link>
      </div>
    </div>
  );
}
