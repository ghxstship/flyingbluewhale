import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { ComplianceForm } from "./ComplianceForm";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

const PLATFORM_CONTROLS = [
  { key: "rls", name: "Row-Level Security", status: "enforced", note: "Every table scoped by org_id via Postgres RLS" },
  { key: "auditLog", name: "Audit Log", status: "enabled", note: "All mutations recorded in audit_log" },
  { key: "encryptionInTransit", name: "Encryption in Transit", status: "enforced", note: "TLS 1.2+" },
  { key: "backups", name: "Backups", status: "daily", note: "7-day retention, point-in-time on enterprise" },
];

type ComplianceSettings = {
  retention_audit_days?: number;
  retention_logs_days?: number;
  encryption_at_rest?: "on" | "off";
  dpa_signed?: "on" | "off";
  data_residency?: "us" | "eu" | "global";
};

export default async function CompliancePage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.settings.compliance.eyebrow", undefined, "Settings")}
          title={t("console.settings.compliance.title", undefined, "Compliance")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.settings.compliance.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data: org } = await supabase.from("orgs").select("compliance_settings").eq("id", session.orgId).maybeSingle();
  const settings = (org?.compliance_settings as ComplianceSettings) ?? {};

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.settings.compliance.eyebrow", undefined, "Settings")}
        title={t("console.settings.compliance.workspaceSettings", undefined, "Workspace Settings")}
        subtitle={t("console.settings.compliance.title", undefined, "Compliance")}
      />
      <div className="page-content max-w-3xl space-y-5">
        <section className="surface p-5">
          <h3 className="text-sm font-semibold">
            {t("console.settings.compliance.workspaceSettings", undefined, "Workspace Settings")}
          </h3>
          <p className="mt-1 text-xs text-[var(--p-text-2)]">
            {t(
              "console.settings.compliance.overrideDescription",
              undefined,
              "Override defaults for retention, encryption and residency. Most controls require an Enterprise plan to relax.",
            )}
          </p>
          <div className="mt-4">
            <ComplianceForm initial={settings} />
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-xs tracking-[0.18em] text-[var(--p-text-2)] uppercase">
            {t("console.settings.compliance.platformControls", undefined, "Platform controls")}
          </h3>
          <div className="overflow-x-auto">
            <table className="ps-table w-full text-sm">
              <thead>
                <tr>
                  <th>{t("console.settings.compliance.columns.control", undefined, "Control")}</th>
                  <th>{t("console.settings.compliance.columns.status", undefined, "Status")}</th>
                  <th>{t("console.settings.compliance.columns.detail", undefined, "Detail")}</th>
                </tr>
              </thead>
              <tbody>
                {PLATFORM_CONTROLS.map((c) => (
                  <tr key={c.name}>
                    <td>{t(`console.settings.compliance.controls.${c.key}.name`, undefined, c.name)}</td>
                    <td>
                      <Badge variant="success">{toTitle(c.status)}</Badge>
                    </td>
                    <td className="text-[var(--p-text-2)]">
                      {t(`console.settings.compliance.controls.${c.key}.note`, undefined, c.note)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
