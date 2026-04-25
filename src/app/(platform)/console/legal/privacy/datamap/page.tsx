import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Data-processing register. Reads what tables exist in the org's data
 * footprint and pairs each with the canonical processor + retention
 * note. This is the GDPR Article 30 register; auditors see this page,
 * so the layout is plain — sortable, sharable, printable.
 */

const REGISTER: Array<{
  domain: string;
  table: string;
  category: "personal" | "financial" | "operational" | "audit";
  processors: string[];
  retention: string;
  legal_basis: "contract" | "legitimate_interest" | "consent" | "legal_obligation";
}> = [
  { domain: "Identity", table: "users", category: "personal", processors: ["Supabase"], retention: "Account lifetime + 30 days", legal_basis: "contract" },
  { domain: "Identity", table: "memberships", category: "personal", processors: ["Supabase"], retention: "Account lifetime", legal_basis: "contract" },
  { domain: "Crew", table: "crew_members", category: "personal", processors: ["Supabase"], retention: "Account lifetime + 1 year", legal_basis: "contract" },
  { domain: "Workforce", table: "workforce_members", category: "personal", processors: ["Supabase"], retention: "7 years (employment record)", legal_basis: "legal_obligation" },
  { domain: "Accreditation", table: "accreditations", category: "personal", processors: ["Supabase"], retention: "Event close + 90 days", legal_basis: "contract" },
  { domain: "Visa", table: "visa_cases", category: "personal", processors: ["Supabase"], retention: "Per visa-issuing authority", legal_basis: "legal_obligation" },
  { domain: "Medical", table: "medical_encounters", category: "personal", processors: ["Supabase"], retention: "Per local clinical record law", legal_basis: "legal_obligation" },
  { domain: "Safeguarding", table: "safeguarding_reports", category: "personal", processors: ["Supabase"], retention: "10 years (safeguarding statute)", legal_basis: "legal_obligation" },
  { domain: "Finance", table: "invoices", category: "financial", processors: ["Supabase", "Stripe"], retention: "7 years (tax)", legal_basis: "legal_obligation" },
  { domain: "Finance", table: "expenses", category: "financial", processors: ["Supabase"], retention: "7 years (tax)", legal_basis: "legal_obligation" },
  { domain: "Finance", table: "advances", category: "financial", processors: ["Supabase", "Stripe"], retention: "7 years (tax)", legal_basis: "legal_obligation" },
  { domain: "AI", table: "ai_conversations", category: "operational", processors: ["Supabase", "Anthropic"], retention: "365 days", legal_basis: "legitimate_interest" },
  { domain: "Audit", table: "audit_log", category: "audit", processors: ["Supabase"], retention: "Configurable; default 365 days", legal_basis: "legitimate_interest" },
  { domain: "Notifications", table: "notifications", category: "operational", processors: ["Supabase"], retention: "180 days", legal_basis: "legitimate_interest" },
  { domain: "Privacy", table: "consent_records", category: "audit", processors: ["Supabase"], retention: "5 years", legal_basis: "legal_obligation" },
  { domain: "Privacy", table: "dsar_requests", category: "audit", processors: ["Supabase"], retention: "5 years", legal_basis: "legal_obligation" },
];

export default async function DatamapPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Privacy" title="Data map" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  // Counts per table — concrete proof of how much PII the operator holds.
  // Skip `users` (auth-scoped, no org_id column) — count memberships instead.
  const COUNTABLE = REGISTER.filter((r) => r.table !== "users");
  const counts = await Promise.all(
    COUNTABLE.slice(0, 10).map(async (entry) => {
      const { count } = await supabase
        .from(entry.table as "memberships")
        .select("*", { count: "exact", head: true })
        .eq("org_id", session.orgId);
      return [entry.table, count ?? 0] as const;
    }),
  );
  const countMap = new Map<string, number>(counts);

  return (
    <>
      <ModuleHeader
        eyebrow="Privacy"
        title="Data map"
        subtitle="GDPR Article 30 processing register"
      />
      <div className="page-content max-w-5xl space-y-4">
        <div className="surface overflow-x-auto">
          <table className="data-table w-full text-sm">
            <thead>
              <tr>
                <th>Domain</th>
                <th>Table</th>
                <th>Records</th>
                <th>Category</th>
                <th>Processors</th>
                <th>Retention</th>
                <th>Legal basis</th>
              </tr>
            </thead>
            <tbody>
              {REGISTER.map((r) => (
                <tr key={r.table}>
                  <td>{r.domain}</td>
                  <td className="font-mono text-xs">{r.table}</td>
                  <td className="font-mono text-xs">{countMap.get(r.table) ?? "—"}</td>
                  <td>
                    <Badge
                      variant={
                        r.category === "personal"
                          ? "warning"
                          : r.category === "financial"
                            ? "info"
                            : r.category === "audit"
                              ? "muted"
                              : "muted"
                      }
                    >
                      {r.category}
                    </Badge>
                  </td>
                  <td className="text-xs text-[var(--text-secondary)]">{r.processors.join(", ")}</td>
                  <td className="text-xs">{r.retention}</td>
                  <td className="text-xs capitalize">{r.legal_basis.replace("_", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          This register reflects the canonical schema. Custom data retained outside the platform must be added separately to your DPA appendix.
        </p>
      </div>
    </>
  );
}
