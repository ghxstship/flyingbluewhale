export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { getRequestT } from "@/lib/i18n/request";
import { createClient } from "@/lib/supabase/server";

/**
 * Notification template register (template-management program, 2026-07-24).
 * The engine's versioned per-channel copy store finally gets an org-facing
 * surface: platform defaults (org_id NULL) plus this org's overrides, read
 * side by side. Read-only v1 — authoring stays with the notification engine
 * (RLS writes are admin-band, uns_templates_admin_*); this page is the
 * inventory the library's notification family deep-links to.
 */
export default async function NotificationTemplatesPage() {
  await requireSession();
  const { t } = await getRequestT();
  const supabase = await createClient();
  // RLS: platform rows (org_id NULL) + this org's rows.
  const { data } = await supabase
    .from("notification_templates")
    .select("id, org_id, template_key, channel, version, body_format, default_locale, template_state")
    .order("template_key", { ascending: true })
    .order("channel", { ascending: true })
    .order("version", { ascending: false })
    .limit(500);
  const rows = data ?? [];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.settings.notificationTemplates.eyebrow", undefined, "Settings")}
        title={t("console.settings.notificationTemplates.title", undefined, "Notification Templates")}
        subtitle={t(
          "console.settings.notificationTemplates.subtitle",
          undefined,
          "Versioned per-channel notification copy. Platform rows are the defaults; org rows override them.",
        )}
      />
      <div className="page-content max-w-5xl">
        {rows.length === 0 ? (
          <p className="text-sm text-[var(--p-text-2)]">
            {t(
              "console.settings.notificationTemplates.empty",
              undefined,
              "No notification templates yet. The engine falls back to its built-in copy.",
            )}
          </p>
        ) : (
          <table className="ps-table w-full">
            <thead>
              <tr>
                <th>{t("console.settings.notificationTemplates.col.key", undefined, "Key")}</th>
                <th>{t("console.settings.notificationTemplates.col.channel", undefined, "Channel")}</th>
                <th>{t("console.settings.notificationTemplates.col.version", undefined, "Version")}</th>
                <th>{t("console.settings.notificationTemplates.col.locale", undefined, "Locale")}</th>
                <th>{t("console.settings.notificationTemplates.col.scope", undefined, "Scope")}</th>
                <th>{t("console.settings.notificationTemplates.col.status", undefined, "Status")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="ps-id">{r.template_key}</td>
                  <td>{r.channel}</td>
                  <td className="ps-id">v{r.version}</td>
                  <td>{r.default_locale}</td>
                  <td>
                    {r.org_id === null ? (
                      <Badge variant="muted">
                        {t("console.settings.notificationTemplates.scopePlatform", undefined, "Platform")}
                      </Badge>
                    ) : (
                      <Badge variant="brand">
                        {t("console.settings.notificationTemplates.scopeOrg", undefined, "Org")}
                      </Badge>
                    )}
                  </td>
                  <td>
                    <Badge variant={r.template_state === "active" ? "success" : "muted"}>{r.template_state}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="mt-4 max-w-2xl text-xs text-[var(--p-text-3)]">
          {t(
            "console.settings.notificationTemplates.readOnlyNote",
            undefined,
            "Read-only register. Template bodies are rendered by the notification engine; per-kind delivery preferences live in each member's notification settings.",
          )}
        </p>
      </div>
    </>
  );
}
