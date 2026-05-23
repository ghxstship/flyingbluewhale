import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { markConducted } from "./actions";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  topic: string;
  status: string;
  scheduled_for: string;
  conducted_at: string | null;
  notes: string | null;
  briefer: { name: string | null; email: string | null } | null;
  project: { id: string; name: string | null } | null;
};

const STATUS_TONE: Record<string, "muted" | "info" | "success"> = {
  scheduled: "info",
  conducted: "success",
  cancelled: "muted",
};

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Scheduled",
  conducted: "Conducted",
  cancelled: "Cancelled",
};

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function Page({ params }: { params: Promise<{ briefingId: string }> }) {
  const { briefingId } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title="Safety Briefing" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("safety_briefings")
    .select(
      "id, topic, status, scheduled_for, conducted_at, notes, briefer:briefer_id(name, email), project:project_id(id, name)",
    )
    .eq("id", briefingId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  const row = data as unknown as Row | null;
  if (!row) notFound();

  const brieferName = row.briefer?.name ?? row.briefer?.email ?? "—";

  return (
    <>
      <ModuleHeader
        eyebrow="Safety · Briefings"
        title={row.topic}
        subtitle={`${fmt(row.scheduled_for)} · ${brieferName}`}
        breadcrumbs={[
          { label: "Safety", href: "/console/safety" },
          { label: "Briefings", href: "/console/safety/briefings" },
          { label: row.topic },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button href="/console/safety/briefings" variant="ghost" size="sm">
              Back
            </Button>
            {row.status === "scheduled" && (
              <form action={markConducted.bind(null, briefingId)}>
                <Button type="submit" size="sm">
                  Mark Conducted
                </Button>
              </form>
            )}
          </div>
        }
      />
      <div className="page-content max-w-3xl space-y-5">
        <section className="surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">Status</h3>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {row.status === "scheduled"
                  ? "Awaiting toolbox talk. Mark conducted once the briefing is complete."
                  : row.status === "conducted"
                    ? `Conducted ${fmt(row.conducted_at)}.`
                    : "Cancelled — no further action required."}
              </p>
            </div>
            <Badge variant={STATUS_TONE[row.status] ?? "muted"}>{STATUS_LABEL[row.status] ?? row.status}</Badge>
          </div>
        </section>

        <dl className="surface grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <dt className="text-xs tracking-wide text-[var(--text-muted)] uppercase">Project</dt>
            <dd className="text-sm">{row.project?.name ?? "—"}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-xs tracking-wide text-[var(--text-muted)] uppercase">Briefer</dt>
            <dd className="text-sm">{brieferName}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-xs tracking-wide text-[var(--text-muted)] uppercase">Scheduled</dt>
            <dd className="font-mono text-xs">{fmt(row.scheduled_for)}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-xs tracking-wide text-[var(--text-muted)] uppercase">Conducted</dt>
            <dd className="font-mono text-xs">{fmt(row.conducted_at)}</dd>
          </div>
        </dl>

        {row.notes && (
          <section className="surface p-5">
            <h3 className="text-sm font-semibold">Notes</h3>
            <p className="mt-2 text-sm whitespace-pre-wrap text-[var(--text-secondary)]">{row.notes}</p>
          </section>
        )}
      </div>
    </>
  );
}
