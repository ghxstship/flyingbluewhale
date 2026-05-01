import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

type Request = {
  id: string;
  category: string;
  description: string | null;
  severity: string;
  status: string;
  opened_at: string;
  resolved_at: string | null;
};

const STATUS_TONE: Record<string, "muted" | "info" | "warning" | "success" | "error"> = {
  open: "info",
  acknowledged: "info",
  in_progress: "warning",
  resolved: "success",
  cancelled: "muted",
};

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Portal" title="Cases" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  // Cases = service requests filed by anyone in this delegation, severity high or urgent
  const { data } = await supabase
    .from("service_requests")
    .select("id, category, description, severity, status, opened_at, resolved_at")
    .eq("org_id", session.orgId)
    .in("severity", ["high", "urgent"])
    .order("opened_at", { ascending: false })
    .limit(100);

  const cases = ((data ?? []) as unknown as Request[]) ?? [];
  const open = cases.filter((c) => c.status !== "resolved" && c.status !== "cancelled").length;

  return (
    <>
      <ModuleHeader
        eyebrow="Portal · Delegation"
        title="Cases"
        subtitle={`${cases.length} case${cases.length === 1 ? "" : "s"} · ${open} open`}
        breadcrumbs={[
          { label: "Portal", href: `/p/${slug}` },
          { label: "Delegation", href: `/p/${slug}/delegation` },
          { label: "Cases" },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Open" value={open.toLocaleString()} />
          <MetricCard label="Resolved" value={(cases.length - open).toLocaleString()} />
          <MetricCard label="Total" value={cases.length.toLocaleString()} />
        </div>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">Open Cases</h3>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            High-priority service requests filed under this delegation. Use the new-request flow on mobile to escalate
            anything urgent.
          </p>
          {cases.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">No high-priority cases.</p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--border-color)]">
              {cases.map((c) => (
                <li key={c.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium">{c.category}</div>
                    {c.description && <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{c.description}</p>}
                    <div className="mt-1 font-mono text-[10px] text-[var(--text-muted)]">
                      opened {fmt(c.opened_at)}
                      {c.resolved_at ? ` · resolved ${fmt(c.resolved_at)}` : ""}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={c.severity === "urgent" ? "error" : "warning"}>{c.severity}</Badge>
                    <Badge variant={STATUS_TONE[c.status] ?? "muted"}>{c.status.replace(/_/g, " ")}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
