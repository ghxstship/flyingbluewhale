import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const INTEGRATIONS = [
  { id: "stripe", name: "Stripe", desc: "Invoicing + Connect payouts", status: "connected" },
  { id: "anthropic", name: "Anthropic (Claude)", desc: "AI assistant + drafting", status: "connected" },
  { id: "slack", name: "Slack", desc: "Notifications + approvals", status: "available" },
  { id: "google", name: "Google Workspace", desc: "SSO + Drive", status: "available" },
  { id: "clickup", name: "ClickUp", desc: "Task sync", status: "available" },
  { id: "hubspot", name: "HubSpot", desc: "CRM sync", status: "available" },
  { id: "quickbooks", name: "QuickBooks", desc: "GL + reconciliation", status: "available" },
];

export default function IntegrationsPage() {
  return (
    <>
      <ModuleHeader eyebrow="Settings" title="Integrations" subtitle="Connect your operational stack" />
      <div className="page-content">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {INTEGRATIONS.map((i) => (
            <div key={i.id} className="surface p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{i.name}</div>
                {i.status === "connected"
                  ? <Badge variant="success">Connected</Badge>
                  : <Badge variant="muted">Available</Badge>}
              </div>
              <p className="mt-2 text-xs text-[var(--text-muted)]">{i.desc}</p>
              <div className="mt-4">
                <Button variant="secondary" disabled={i.status === "connected"}>
                  {i.status === "connected" ? "Manage" : "Connect"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
