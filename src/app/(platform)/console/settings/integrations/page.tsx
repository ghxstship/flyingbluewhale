import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase, env } from "@/lib/env";
import { KNOWN_CONNECTORS } from "./connectors";
import { installConnector, uninstallConnector } from "./actions";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Settings" title="Integrations" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("org_integrations")
    .select("connector, status, installed_at")
    .eq("org_id", session.orgId);
  const installed = new Map((data ?? []).map((r) => [r.connector, r.status]));

  // Some integrations are auto-detected from env (Stripe key, Anthropic key)
  // so we surface those as "connected" even before the install row exists.
  const envProof: Record<string, boolean> = {
    stripe: Boolean(env.STRIPE_SECRET_KEY),
    anthropic: Boolean(env.ANTHROPIC_API_KEY),
  };

  return (
    <>
      <ModuleHeader eyebrow="Settings" title="Workspace Settings" subtitle="Integrations" />
      <div className="page-content">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {KNOWN_CONNECTORS.map((c) => {
            const dbStatus = installed.get(c.id);
            const isInstalled = dbStatus === "installed" || envProof[c.id];
            return (
              <div key={c.id} className="surface flex flex-col p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{c.name}</div>
                  {isInstalled ? <Badge variant="success">Connected</Badge> : <Badge variant="muted">Available</Badge>}
                </div>
                <p className="mt-2 text-xs text-[var(--text-muted)]">{c.desc}</p>
                <div className="mt-4 flex gap-2">
                  {isInstalled && dbStatus ? (
                    <form action={uninstallConnector}>
                      <input type="hidden" name="connector" value={c.id} />
                      <Button type="submit" variant="ghost" size="sm" className="text-[var(--color-error)]">
                        Disconnect
                      </Button>
                    </form>
                  ) : !envProof[c.id] ? (
                    <form action={installConnector}>
                      <input type="hidden" name="connector" value={c.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        Connect
                      </Button>
                    </form>
                  ) : (
                    <span className="text-xs text-[var(--text-muted)]">via env</span>
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
