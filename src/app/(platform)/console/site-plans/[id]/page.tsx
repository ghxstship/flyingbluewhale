import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { ConversationPanel } from "@/components/ConversationPanel";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();

  const { data: plan } = await supabase
    .from("site_plans")
    .select("*, project:project_id(name), venue:venue_id(name)")
    .eq("org_id", session.orgId)
    .eq("id", id)
    .maybeSingle();
  if (!plan) notFound();

  const [{ data: revisions }, { data: pins }] = await Promise.all([
    supabase.from("site_plan_revisions").select("*").eq("site_plan_id", id).order("uploaded_at", { ascending: false }),
    supabase.from("site_plan_pins").select("*").eq("site_plan_id", id).order("created_at", { ascending: false }),
  ]);

  return (
    <>
      <ModuleHeader
        eyebrow="Venues"
        breadcrumbs={[{ label: "Site Plans", href: "/console/site-plans" }, { label: plan.code }]}
        title={`${plan.code} — ${plan.title}`}
        subtitle={
          (plan.venue as unknown as { name: string | null } | null)?.name ??
          (plan.project as unknown as { name: string | null } | null)?.name ??
          "—"
        }
        action={
          <div className="flex items-center gap-2">
            <Badge variant="info">{plan.discipline}</Badge>
            <a
              href={`/console/site-plans/${plan.id}/edit`}
              className="surface hover-lift rounded-md px-3 py-1.5 text-xs font-medium"
            >
              Edit
            </a>
          </div>
        }
      />
      <div className="page-content space-y-5">
        <section className="surface p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Revisions</h3>
            <span className="text-xs text-[var(--text-muted)]">{(revisions ?? []).length} on file</span>
          </div>
          {(revisions ?? []).length === 0 ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              No revisions yet. Upload one to render markups + pins.
            </p>
          ) : (
            <table className="data-table mt-3">
              <thead>
                <tr>
                  <th>Rev</th>
                  <th>Uploaded</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {(revisions ?? []).map((r) => (
                  <tr key={r.id}>
                    <td className="font-mono text-xs">{r.revision_label}</td>
                    <td className="font-mono text-xs">{fmt(r.uploaded_at)}</td>
                    <td>{r.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        <section className="surface p-4">
          <h3 className="text-sm font-semibold">Pins</h3>
          {(pins ?? []).length === 0 ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              No pins yet. Pins link to RFIs, punch items, inspections, and zone callouts.
            </p>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {(pins ?? []).map((p) => (
                <li key={p.id} className="surface-inset p-2 text-xs">
                  <span className="font-mono text-[10px]">{p.pin_type}</span> · {p.label ?? "—"} ·
                  <span className="text-[var(--text-muted)]">
                    {" "}
                    ({Number(p.x_pct).toFixed(0)}%, {Number(p.y_pct).toFixed(0)}%)
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <ConversationPanel orgId={session.orgId} recordType="site_plan" recordId={id} />
      </div>
    </>
  );
}
