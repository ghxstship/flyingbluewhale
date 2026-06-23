import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase, env } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { KNOWN_CONNECTORS } from "./connectors";
import { installConnector, uninstallConnector } from "./actions";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.settings.integrations.eyebrow", undefined, "Settings")}
          title={t("console.settings.integrations.title", undefined, "Integrations")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.settings.integrations.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("org_integrations")
    .select("connector, integration_state, installed_at")
    .eq("org_id", session.orgId);
  const installed = new Map((data ?? []).map((r) => [r.connector, r.integration_state]));

  // Some integrations are auto-detected from env (Stripe key, Anthropic key)
  // so we surface those as "connected" even before the install row exists.
  const envProof: Record<string, boolean> = {
    stripe: Boolean(env.STRIPE_SECRET_KEY),
    anthropic: Boolean(env.ANTHROPIC_API_KEY),
  };

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.settings.integrations.eyebrow", undefined, "Settings")}
        title={t("console.settings.integrations.workspaceTitle", undefined, "Workspace Settings")}
        subtitle={t("console.settings.integrations.subtitle", undefined, "Integrations")}
      />
      <div className="page-content">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {KNOWN_CONNECTORS.map((c) => {
            const dbStatus = installed.get(c.id);
            const isInstalled = dbStatus === "installed" || envProof[c.id];
            return (
              <div key={c.id} className="surface flex flex-col p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{c.name}</div>
                  {isInstalled ? (
                    <Badge variant="success">
                      {t("console.settings.integrations.connected", undefined, "Connected")}
                    </Badge>
                  ) : (
                    <Badge variant="muted">
                      {t("console.settings.integrations.available", undefined, "Available")}
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-xs text-[var(--p-text-2)]">{c.desc}</p>
                <div className="mt-4 flex gap-2">
                  {isInstalled && dbStatus ? (
                    <form action={uninstallConnector}>
                      <input type="hidden" name="connector" value={c.id} />
                      <button type="submit" className="text-xs text-[var(--p-danger)] hover:underline">
                        {t("console.settings.integrations.disconnect", undefined, "Disconnect")}
                      </button>
                    </form>
                  ) : !envProof[c.id] ? (
                    <form action={installConnector}>
                      <input type="hidden" name="connector" value={c.id} />
                      <button type="submit" className="text-xs font-medium text-[var(--p-accent)] hover:underline">
                        {t("console.settings.integrations.connect", undefined, "Connect")}
                      </button>
                    </form>
                  ) : (
                    <span className="text-xs text-[var(--p-text-2)]">
                      {t("console.settings.integrations.viaEnv", undefined, "via env")}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
