import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

export default function ApiSettingsPage() {
  return (
    <>
      <ModuleHeader eyebrow="Settings" title="API" subtitle="Programmatic access to ATLVS" />
      <div className="page-content space-y-4 max-w-3xl">
        <div className="surface p-5">
          <h3 className="text-sm font-semibold">Base URL</h3>
          <pre className="mt-3 rounded-lg bg-[var(--bg-secondary)] p-3 font-mono text-xs">https://your-domain.tld/api/v1</pre>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Every endpoint validates bodies with Zod and returns <code>{'{ ok, data }'}</code> or <code>{'{ ok: false, error }'}</code>.
          </p>
        </div>

        <div className="surface p-5">
          <h3 className="text-sm font-semibold">Endpoints</h3>
          <table className="data-table mt-3">
            <thead><tr><th>Method</th><th>Path</th><th>Description</th></tr></thead>
            <tbody>
              {[
                ["GET", "/api/v1/health", "Liveness probe"],
                ["GET", "/api/v1/projects", "List projects (org-scoped)"],
                ["POST", "/api/v1/projects", "Create project"],
                ["GET", "/api/v1/projects/[id]", "Get a project"],
                ["PATCH", "/api/v1/projects/[id]", "Update project"],
                ["POST", "/api/v1/tickets/scan", "Scan a ticket (race-safe)"],
                ["GET", "/api/v1/deliverables/[id]/download", "Signed download URL (60s)"],
                ["POST", "/api/v1/ai/chat", "Streaming Anthropic chat"],
                ["POST", "/api/v1/webhooks/stripe", "Stripe webhook receiver"],
              ].map(([m, p, d]) => (
                <tr key={p}>
                  <td><Badge variant="brand">{m}</Badge></td>
                  <td className="font-mono text-xs">{p}</td>
                  <td className="text-[var(--text-secondary)]">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="surface p-5">
          <h3 className="text-sm font-semibold">Issuing API keys</h3>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Personal access tokens are scoped to your org + role. Generate from <Link href="/me/security" className="text-[var(--org-primary)]">Personal &gt; Security</Link>.
          </p>
        </div>
      </div>
    </>
  );
}
