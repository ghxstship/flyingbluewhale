import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { revokeApiKeyAction } from "./actions";
import { CreateApiKeyForm } from "./CreateApiKeyForm";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function ApiSettingsPage() {
  const { t } = await getRequestT();
  const ENDPOINT_DOCS: Array<[string, string, string]> = [
    ["GET", "/api/v1/health", t("console.settings.api.endpoints.health", undefined, "Liveness probe")],
    [
      "GET",
      "/api/v1/projects",
      t("console.settings.api.endpoints.listProjects", undefined, "List projects (org-scoped)"),
    ],
    ["POST", "/api/v1/projects", t("console.settings.api.endpoints.createProject", undefined, "Create project")],
    ["GET", "/api/v1/projects/[id]", t("console.settings.api.endpoints.getProject", undefined, "Get a project")],
    ["PATCH", "/api/v1/projects/[id]", t("console.settings.api.endpoints.updateProject", undefined, "Update project")],
    [
      "POST",
      "/api/v1/scan",
      t("console.settings.api.endpoints.scan", undefined, "Scan an assignment code (race-safe, any catalog kind)"),
    ],
    ["POST", "/api/v1/risks", t("console.settings.api.endpoints.createRisk", undefined, "Create RAID register entry")],
    [
      "POST",
      "/api/v1/crisis/alerts",
      t("console.settings.api.endpoints.crisisAlert", undefined, "Broadcast crisis alert"),
    ],
    [
      "GET",
      "/api/v1/deliverables/[id]/download",
      t("console.settings.api.endpoints.deliverableDownload", undefined, "Signed download URL (60s)"),
    ],
    ["POST", "/api/v1/ai/chat", t("console.settings.api.endpoints.aiChat", undefined, "Streaming Anthropic chat")],
    [
      "POST",
      "/api/v1/webhooks/stripe",
      t("console.settings.api.endpoints.stripeWebhook", undefined, "Stripe webhook receiver"),
    ],
  ];
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.settings.eyebrow", undefined, "Settings")}
          title={t("console.settings.api.shortTitle", undefined, "API")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.settings.api.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const { data } = await supabase
    .from("api_keys")
    .select("id, name, prefix, scopes, last_used_at, expires_at, revoked_at, created_at")
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false });
  const keys = data ?? [];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.settings.eyebrow", undefined, "Settings")}
        title={t("console.settings.api.title", undefined, "Workspace Settings")}
        subtitle={t("console.settings.api.subtitle", undefined, "API & keys")}
      />
      <div className="page-content max-w-3xl space-y-5">
        <section className="surface p-5">
          <h3 className="text-sm font-semibold">{t("console.settings.api.baseUrl", undefined, "Base URL")}</h3>
          <pre className="mt-3 rounded-lg bg-[var(--bg-secondary)] p-3 font-mono text-xs">
            https://your-domain.tld/api/v1
          </pre>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            {t("console.settings.api.zodHintPrefix", undefined, "Every endpoint validates bodies with Zod and returns")}{" "}
            <code className="font-mono">{`{ ok, data }`}</code> {t("console.settings.api.zodHintOr", undefined, "or")}{" "}
            <code className="font-mono">{`{ ok: false, error }`}</code>.
          </p>
        </section>

        <section className="surface p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{t("console.settings.api.apiKeys", undefined, "API keys")}</h3>
            <CreateApiKeyForm />
          </div>
          <table className="data-table mt-3 w-full text-sm">
            <thead>
              <tr>
                <th>{t("console.settings.api.col.name", undefined, "Name")}</th>
                <th>{t("console.settings.api.col.prefix", undefined, "Prefix")}</th>
                <th>{t("console.settings.api.col.scopes", undefined, "Scopes")}</th>
                <th>{t("console.settings.api.col.lastUsed", undefined, "Last used")}</th>
                <th>{t("console.settings.api.col.status", undefined, "Status")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {keys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[var(--text-muted)]">
                    {t("console.settings.api.empty", undefined, "No API keys yet.")}
                  </td>
                </tr>
              ) : (
                keys.map((k) => {
                  const revoked = !!k.revoked_at;
                  return (
                    <tr key={k.id}>
                      <td>{k.name}</td>
                      <td className="font-mono text-xs">{k.prefix}…</td>
                      <td className="text-xs text-[var(--text-secondary)]">{(k.scopes ?? []).join(", ") || "—"}</td>
                      <td className="font-mono text-xs">
                        {k.last_used_at
                          ? fmt.dateTime(k.last_used_at)
                          : t("console.settings.api.never", undefined, "Never")}
                      </td>
                      <td>
                        <Badge variant={revoked ? "muted" : "success"}>
                          {revoked
                            ? t("console.settings.api.revoked", undefined, "Revoked")
                            : t("console.settings.api.active", undefined, "Active")}
                        </Badge>
                      </td>
                      <td>
                        {!revoked && (
                          <form action={revokeApiKeyAction}>
                            <input type="hidden" name="id" value={k.id} />
                            <button type="submit" className="text-xs text-[var(--color-error)] hover:underline">
                              {t("console.settings.api.revoke", undefined, "Revoke")}
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">
            {t("console.settings.api.endpoints.heading", undefined, "Endpoints")}
          </h3>
          <table className="data-table mt-3 w-full text-sm">
            <thead>
              <tr>
                <th>{t("console.settings.api.col.method", undefined, "Method")}</th>
                <th>{t("console.settings.api.col.path", undefined, "Path")}</th>
                <th>{t("console.settings.api.col.description", undefined, "Description")}</th>
              </tr>
            </thead>
            <tbody>
              {ENDPOINT_DOCS.map(([m, p, d]) => (
                <tr key={p}>
                  <td>
                    <Badge variant="brand">{m}</Badge>
                  </td>
                  <td className="font-mono text-xs">{p}</td>
                  <td className="text-[var(--text-secondary)]">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}
