import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Acc = {
  id: string;
  person_name: string;
  state: string;
  vetting: string;
  issued_at: string | null;
  valid_from: string | null;
  valid_to: string | null;
  category: { code: string; name: string } | null;
};

const STATE_TONE: Record<string, "muted" | "info" | "warning" | "success" | "error"> = {
  applied: "info",
  vetting: "warning",
  approved: "info",
  issued: "success",
  suspended: "warning",
  revoked: "error",
};

const VETTING_TONE: Record<string, "muted" | "info" | "warning" | "success" | "error"> = {
  pending: "muted",
  in_progress: "info",
  clear: "success",
  flagged: "warning",
  failed: "error",
};

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Portal" title="Apply" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();

  function fmtDate(iso: string | null): string {
    if (!iso) return "—";
    return fmt.dateParts(iso, { month: "short", day: "numeric", year: "numeric" });
  }
  const { data } = await supabase
    .from("accreditations")
    .select("id, person_name, state, vetting, issued_at, valid_from, valid_to, category:category_id(code, name)")
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false });

  const apps = ((data ?? []) as unknown as Acc[]) ?? [];
  const issued = apps.filter((a) => a.state === "issued").length;
  const inFlight = apps.filter((a) => ["applied", "vetting", "approved"].includes(a.state)).length;

  return (
    <>
      <ModuleHeader
        eyebrow="Portal"
        title="Accreditation"
        subtitle={`${apps.length} Application${apps.length === 1 ? "" : "s"} on file`}
        breadcrumbs={[{ label: "Portal", href: `/p/${slug}` }, { label: "Apply" }]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Issued" value={fmt.number(issued)} accent={issued > 0} />
          <MetricCard label="In Review" value={fmt.number(inFlight)} />
          <MetricCard label="Total" value={fmt.number(apps.length)} />
        </div>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">Start a New Application</h3>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Apply for accreditation against any of the project's published categories. We verify identity, check zone
            access, and issue your card on approval.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/p/${slug}/apply/changes`} className="btn btn-secondary btn-sm">
              Request a category change
            </Link>
            <Link
              href={`mailto:accreditation@atlvs.pro?subject=New%20application%20—%20${slug}`}
              className="btn btn-primary btn-sm"
            >
              Email producer
            </Link>
          </div>
        </section>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">Your Applications</h3>
          {apps.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              No applications yet — your producer will invite you.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--border-color)]">
              {apps.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <div className="font-medium">{a.person_name}</div>
                    <div className="font-mono text-[10px] text-[var(--text-muted)]">
                      {a.category?.code ?? "—"} · {a.category?.name ?? ""}
                      {a.valid_from && a.valid_to ? ` · ${fmtDate(a.valid_from)} – ${fmtDate(a.valid_to)}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={VETTING_TONE[a.vetting] ?? "muted"}>{a.vetting.replace(/_/g, " ")}</Badge>
                    <Badge variant={STATE_TONE[a.state] ?? "muted"}>{a.state}</Badge>
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
