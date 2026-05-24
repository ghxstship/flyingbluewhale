import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type ChangeRow = {
  id: string;
  kind: string;
  status: string;
  note: string | null;
  created_at: string;
  decided_at: string | null;
  accreditation: { id: string; person_name: string } | null;
};

const STATUS_TONE: Record<string, "muted" | "info" | "warning" | "success" | "error"> = {
  requested: "info",
  in_review: "warning",
  approved: "success",
  rejected: "error",
  cancelled: "muted",
};

const KIND_LABEL: Record<string, string> = {
  upgrade: "Category upgrade",
  downgrade: "Category downgrade",
  zone_add: "Add zone",
  zone_remove: "Remove zone",
  replacement: "Card replacement",
  reissue: "Reissue (lost / damaged)",
  name_change: "Name change",
  photo_update: "Photo update",
};

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Portal" title="Card Changes" />
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
  // Filter to changes the requester filed themselves.
  const { data } = await supabase
    .from("accreditation_changes")
    .select("id, kind, status, note, created_at, decided_at, accreditation:accreditation_id(id, person_name)")
    .eq("org_id", session.orgId)
    .eq("requested_by", session.userId)
    .order("created_at", { ascending: false });

  const changes = ((data ?? []) as unknown as ChangeRow[]) ?? [];
  const open = changes.filter((c) => c.status === "requested" || c.status === "in_review").length;

  return (
    <>
      <ModuleHeader
        eyebrow="Portal · Apply"
        title="Card Changes"
        subtitle={`${changes.length} Request${changes.length === 1 ? "" : "s"} · ${open} Open`}
        breadcrumbs={[
          { label: "Portal", href: `/p/${slug}` },
          { label: "Apply", href: `/p/${slug}/apply` },
          { label: "Changes" },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Open" value={fmt.number(open)} />
          <MetricCard label="Approved" value={fmt.number(changes.filter((c) => c.status === "approved").length)} />
          <MetricCard label="Rejected" value={fmt.number(changes.filter((c) => c.status === "rejected").length)} />
        </div>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">How This Works</h3>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Use this page to request changes to an existing card — upgrades, replacements, zone adjustments, or
            corrections. Producer reviews each request; approval may require resubmitting your photo or vetting docs.
          </p>
        </section>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">Your Requests</h3>
          {changes.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">No card-change requests on file yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--border-color)]">
              {changes.map((c) => (
                <li key={c.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium">{KIND_LABEL[c.kind] ?? c.kind}</div>
                    <div className="font-mono text-[10px] text-[var(--text-muted)]">
                      {c.accreditation?.person_name ?? "—"} · filed {fmtDate(c.created_at)}
                      {c.decided_at ? ` · decided ${fmtDate(c.decided_at)}` : ""}
                    </div>
                    {c.note && <p className="mt-1 text-xs text-[var(--text-secondary)]">{c.note}</p>}
                  </div>
                  <Badge variant={STATUS_TONE[c.status] ?? "muted"}>{toTitle(c.status)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
