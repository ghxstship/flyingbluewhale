import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";

const ROLES: { role: string; description: string; tier: "all" | "professional" | "enterprise" }[] = [
  { role: "owner", description: "Full access · billing · delete organization", tier: "all" },
  { role: "admin", description: "Full access except billing + org delete", tier: "all" },
  { role: "controller", description: "Finance, procurement, approvals", tier: "all" },
  { role: "collaborator", description: "Projects, tasks, crew, clients, proposals", tier: "all" },
  { role: "contractor", description: "Project-scoped vendor view + time logging", tier: "professional" },
  { role: "crew", description: "Day-of tasks, check-in, clock-in", tier: "all" },
  { role: "client", description: "Client portal — proposals, deliverables, invoices", tier: "all" },
  { role: "viewer", description: "Read-only on assigned projects", tier: "all" },
  { role: "community", description: "No org access", tier: "all" },
  { role: "developer", description: "API keys + webhooks + audit", tier: "enterprise" },
];

export default function RolesPage() {
  return (
    <>
      <ModuleHeader eyebrow="People" title="Role matrix" subtitle="10 platform roles · 4 tiers" />
      <div className="page-content">
        <div className="surface overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Role</th><th>Tier</th><th>Capabilities</th></tr></thead>
            <tbody>
              {ROLES.map((r) => (
                <tr key={r.role}>
                  <td><Badge variant="brand">{r.role}</Badge></td>
                  <td className="font-mono text-xs">{r.tier}</td>
                  <td className="text-[var(--text-secondary)]">{r.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
