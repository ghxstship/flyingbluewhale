import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { CommitteeForm, PolicyForm } from "./Forms";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function GovernancePage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Settings" title="Governance" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const [{ data: committees }, { data: policies }] = await Promise.all([
    supabase
      .from("governance_committees")
      .select("id, name, cadence, charter, created_at")
      .eq("org_id", session.orgId)
      .order("created_at", { ascending: false }),
    supabase
      .from("governance_policies")
      .select("id, name, category, status, effective_at, next_review_at")
      .eq("org_id", session.orgId)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <>
      <ModuleHeader
        eyebrow="Settings"
        title="Workspace settings"
        subtitle="Governance"
      />
      <div className="page-content max-w-4xl space-y-6">
        <section className="surface p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Committees</h3>
            <CommitteeForm />
          </div>
          <table className="data-table mt-3 w-full text-sm">
            <thead>
              <tr>
                <th>Name</th>
                <th>Cadence</th>
                <th>Charter</th>
              </tr>
            </thead>
            <tbody>
              {(committees ?? []).length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-[var(--text-muted)]">
                    No committees yet.
                  </td>
                </tr>
              ) : (
                (committees ?? []).map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td className="text-xs text-[var(--text-secondary)]">
                      {c.cadence?.replace("_", " ") ?? "—"}
                    </td>
                    <td className="text-xs text-[var(--text-muted)]">{c.charter ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        <section className="surface p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Policies</h3>
            <PolicyForm />
          </div>
          <table className="data-table mt-3 w-full text-sm">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Status</th>
                <th>Next review</th>
              </tr>
            </thead>
            <tbody>
              {(policies ?? []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-[var(--text-muted)]">
                    No policies yet.
                  </td>
                </tr>
              ) : (
                (policies ?? []).map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td className="text-xs capitalize text-[var(--text-secondary)]">{p.category}</td>
                    <td>
                      <Badge variant={p.status === "active" ? "success" : "muted"}>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="font-mono text-xs">
                      {p.next_review_at ? new Date(p.next_review_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}
