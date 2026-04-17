import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";

const CONTROLS = [
  { name: "Row-Level Security", status: "enforced", note: "Every table scoped by org_id via Postgres RLS" },
  { name: "Audit log", status: "enabled", note: "All mutations recorded in audit_log" },
  { name: "Encryption at rest", status: "enforced", note: "AES-256 via Supabase" },
  { name: "Encryption in transit", status: "enforced", note: "TLS 1.2+" },
  { name: "Backups", status: "daily", note: "7-day retention, point-in-time on enterprise" },
  { name: "GDPR DPA", status: "available", note: "Auto-signed on subscription" },
  { name: "Data export", status: "self-serve", note: "JSONL export of all org-scoped tables" },
  { name: "Retention policy", status: "90 days default", note: "Customize per module on enterprise" },
];

export default function CompliancePage() {
  return (
    <>
      <ModuleHeader eyebrow="Settings" title="Compliance" subtitle="Security, data protection, and retention" />
      <div className="page-content">
        <div className="surface overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Control</th><th>Status</th><th>Detail</th></tr></thead>
            <tbody>
              {CONTROLS.map((c) => (
                <tr key={c.name}>
                  <td>{c.name}</td>
                  <td><Badge variant="success">{c.status}</Badge></td>
                  <td className="text-[var(--text-secondary)]">{c.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
