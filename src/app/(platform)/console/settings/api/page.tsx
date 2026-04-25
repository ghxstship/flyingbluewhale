import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { revokeApiKeyAction } from "./actions";
import { CreateApiKeyForm } from "./CreateApiKeyForm";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

const ENDPOINT_DOCS = [
  ["GET", "/api/v1/health", "Liveness probe"],
  ["GET", "/api/v1/projects", "List projects (org-scoped)"],
  ["POST", "/api/v1/projects", "Create project"],
  ["GET", "/api/v1/projects/[id]", "Get a project"],
  ["PATCH", "/api/v1/projects/[id]", "Update project"],
  ["POST", "/api/v1/tickets/scan", "Scan a ticket (race-safe)"],
  ["POST", "/api/v1/risks", "Create RAID register entry"],
  ["POST", "/api/v1/crisis/alerts", "Broadcast crisis alert"],
  ["GET", "/api/v1/deliverables/[id]/download", "Signed download URL (60s)"],
  ["POST", "/api/v1/ai/chat", "Streaming Anthropic chat"],
  ["POST", "/api/v1/webhooks/stripe", "Stripe webhook receiver"],
];

export default async function ApiSettingsPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Settings" title="API" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("api_keys")
    .select("id, name, prefix, scopes, last_used_at, expires_at, revoked_at, created_at")
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false });
  const keys = data ?? [];

  return (
    <>
      <ModuleHeader
        eyebrow="Settings"
        title="Workspace settings"
        subtitle="API & keys"
      />
      <div className="page-content max-w-3xl space-y-5">
        <section className="surface p-5">
          <h3 className="text-sm font-semibold">Base URL</h3>
          <pre className="mt-3 rounded-lg bg-[var(--bg-secondary)] p-3 font-mono text-xs">
            https://your-domain.tld/api/v1
          </pre>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Every endpoint validates bodies with Zod and returns{" "}
            <code className="font-mono">{`{ ok, data }`}</code> or{" "}
            <code className="font-mono">{`{ ok: false, error }`}</code>.
          </p>
        </section>

        <section className="surface p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">API keys</h3>
            <CreateApiKeyForm />
          </div>
          <table className="data-table mt-3 w-full text-sm">
            <thead>
              <tr>
                <th>Name</th>
                <th>Prefix</th>
                <th>Scopes</th>
                <th>Last used</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {keys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[var(--text-muted)]">
                    No API keys yet.
                  </td>
                </tr>
              ) : (
                keys.map((k) => {
                  const revoked = !!k.revoked_at;
                  return (
                    <tr key={k.id}>
                      <td>{k.name}</td>
                      <td className="font-mono text-xs">{k.prefix}…</td>
                      <td className="text-xs text-[var(--text-secondary)]">
                        {(k.scopes ?? []).join(", ") || "—"}
                      </td>
                      <td className="font-mono text-xs">
                        {k.last_used_at ? new Date(k.last_used_at).toLocaleString() : "Never"}
                      </td>
                      <td>
                        <Badge variant={revoked ? "muted" : "success"}>
                          {revoked ? "Revoked" : "Active"}
                        </Badge>
                      </td>
                      <td>
                        {!revoked && (
                          <form action={revokeApiKeyAction}>
                            <input type="hidden" name="id" value={k.id} />
                            <button
                              type="submit"
                              className="text-xs text-[var(--color-error)] hover:underline"
                            >
                              Revoke
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
          <h3 className="text-sm font-semibold">Endpoints</h3>
          <table className="data-table mt-3 w-full text-sm">
            <thead>
              <tr>
                <th>Method</th>
                <th>Path</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {ENDPOINT_DOCS.map(([m, p, d]) => (
                <tr key={p}>
                  <td><Badge variant="brand">{m}</Badge></td>
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
