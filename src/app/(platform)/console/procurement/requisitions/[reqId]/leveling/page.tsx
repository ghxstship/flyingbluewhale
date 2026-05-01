import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { awardResponse } from "./actions";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning" | "error"> = {
  invited: "muted",
  viewed: "info",
  responded: "info",
  no_bid: "muted",
  withdrawn: "muted",
  awarded: "success",
  declined: "error",
};

export default async function Page({ params }: { params: Promise<{ reqId: string }> }) {
  const { reqId } = await params;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();

  const { data: req } = await supabase
    .from("requisitions")
    .select("id, title, description, estimated_cents")
    .eq("org_id", session.orgId)
    .eq("id", reqId)
    .maybeSingle();
  if (!req) notFound();

  const { data: responses } = await supabase
    .from("rfq_responses")
    .select("*, vendor:vendor_id(name)")
    .eq("requisition_id", reqId)
    .order("total_cents", { ascending: true, nullsFirst: false });

  const all = responses ?? [];
  const responded = all.filter((r) => r.status === "responded" || r.status === "awarded");
  const lowest = responded.reduce(
    (lo, r) => (r.total_cents != null && (lo == null || r.total_cents < lo) ? r.total_cents : lo),
    null as number | null,
  );
  const awardedRow = all.find((r) => r.status === "awarded");

  return (
    <>
      <ModuleHeader
        eyebrow="Procurement"
        breadcrumbs={[
          { label: "Requisitions", href: "/console/procurement/requisitions" },
          { label: req.title, href: `/console/procurement/requisitions/${reqId}` },
          { label: "Leveling" },
        ]}
        title={`Bid leveling — ${req.title}`}
        subtitle={`${all.length} response${all.length === 1 ? "" : "s"} · ${responded.length} priced · est. ${formatMoney(req.estimated_cents ?? 0)}`}
        action={
          <Button href={`/console/procurement/requisitions/${reqId}/leveling/new`} size="sm">
            + Add response
          </Button>
        }
      />
      <div className="page-content space-y-4">
        <section className="surface p-4">
          {all.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)]">No bid responses yet. Invite vendors to bid.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Δ vs lowest</th>
                  <th>Submitted</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {all.map((r) => {
                  const total = r.total_cents == null ? null : Number(r.total_cents);
                  const delta = total != null && lowest != null ? total - lowest : null;
                  return (
                    <tr key={r.id} className={r.status === "awarded" ? "bg-[var(--surface-raised)]" : ""}>
                      <td>{(r.vendor as unknown as { name: string | null } | null)?.name ?? "—"}</td>
                      <td>
                        <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{r.status.replace("_", " ")}</Badge>
                      </td>
                      <td className="font-mono text-xs">{total != null ? formatMoney(total) : "—"}</td>
                      <td className="font-mono text-xs">
                        {delta != null && delta > 0 ? `+${formatMoney(delta)}` : delta === 0 ? "—" : "—"}
                      </td>
                      <td className="font-mono text-xs">
                        {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : "—"}
                      </td>
                      <td>
                        {!awardedRow && r.status === "responded" && (
                          <form action={awardResponse.bind(null, reqId, r.id)}>
                            <button
                              type="submit"
                              className="hover-lift rounded border border-[var(--border-color)] px-2 py-1 text-[11px]"
                            >
                              Award
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </>
  );
}
