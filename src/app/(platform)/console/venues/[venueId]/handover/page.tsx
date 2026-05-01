import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/ui/MetricCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

type HandoverState = Database["public"]["Enums"]["handover_state"];

type VenueRow = { id: string; name: string; handover_state: HandoverState };
type ItemRow = {
  id: string;
  category: string;
  description: string;
  status: string;
  due_at: string | null;
  resolved_at: string | null;
  notes: string | null;
};

const STATE_LABEL: Record<HandoverState, string> = {
  not_started: "Not started",
  inspection: "Inspection",
  snag: "Snag",
  sign_off: "Sign-off",
  accepted: "Accepted",
  closeout: "Closeout",
};

const STATE_TONE: Record<HandoverState, "muted" | "warning" | "info" | "success"> = {
  not_started: "muted",
  inspection: "info",
  snag: "warning",
  sign_off: "info",
  accepted: "success",
  closeout: "muted",
};

const ITEM_TONE: Record<string, "muted" | "info" | "warning" | "success" | "error"> = {
  open: "muted",
  in_progress: "info",
  blocked: "warning",
  passed: "success",
  failed: "error",
  waived: "muted",
};

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default async function Page({ params }: { params: Promise<{ venueId: string }> }) {
  const { venueId } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Venue" title="Handover" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const [{ data: venueData }, { data: itemData }] = await Promise.all([
    supabase
      .from("venues")
      .select("id, name, handover_state")
      .eq("id", venueId)
      .eq("org_id", session.orgId)
      .maybeSingle(),
    supabase
      .from("venue_handover_items")
      .select("id, category, description, status, due_at, resolved_at, notes")
      .eq("venue_id", venueId)
      .eq("org_id", session.orgId)
      .order("status", { ascending: true })
      .order("due_at", { ascending: true, nullsFirst: false }),
  ]);

  const venue = venueData as VenueRow | null;
  if (!venue) notFound();
  const items = ((itemData ?? []) as unknown as ItemRow[]) ?? [];

  const passed = items.filter((i) => i.status === "passed").length;
  const failed = items.filter((i) => i.status === "failed").length;
  const open = items.filter((i) => ["open", "in_progress", "blocked"].includes(i.status)).length;
  const completed = passed + items.filter((i) => i.status === "waived").length;
  const pct = items.length > 0 ? Math.round((completed / items.length) * 100) : 0;

  return (
    <>
      <ModuleHeader
        eyebrow="Venue"
        title={`${venue.name} — Handover`}
        subtitle={`${items.length} commissioning item${items.length === 1 ? "" : "s"}`}
        breadcrumbs={[
          { label: "Venues", href: "/console/venues" },
          { label: venue.name, href: `/console/venues/${venue.id}` },
          { label: "Handover" },
        ]}
        action={<Badge variant={STATE_TONE[venue.handover_state]}>{STATE_LABEL[venue.handover_state]}</Badge>}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Passed" value={passed.toLocaleString()} accent />
          <MetricCard label="Open" value={open.toLocaleString()} />
          <MetricCard label="Failed" value={failed.toLocaleString()} />
        </div>

        {items.length > 0 && (
          <section className="surface p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Commissioning Progress</h3>
              <span className="font-mono text-xs">{pct}%</span>
            </div>
            <ProgressBar value={pct} className="mt-3" />
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Progress = (passed + waived) / total. Snags must be resolved before sign-off.
            </p>
          </section>
        )}

        <DataTable<ItemRow>
          rows={items}
          emptyLabel="No handover items yet"
          emptyDescription="Author the commissioning checklist — overlay, MEP, IT, signage, broadcast, catering, medical, security, operations. Each item gets owned, due-dated, and signed off."
          columns={[
            {
              key: "category",
              header: "Category",
              render: (r) => <Badge variant="muted">{r.category}</Badge>,
              accessor: (r) => r.category ?? null,
              filterable: true,
              groupable: true,
            },
            { key: "desc", header: "Item", render: (r) => r.description, accessor: (r) => r.description },
            { key: "due", header: "Due", render: (r) => <span className="font-mono text-xs">{fmt(r.due_at)}</span> },
            {
              key: "resolved",
              header: "Resolved",
              render: (r) => <span className="font-mono text-xs">{fmt(r.resolved_at)}</span>,
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <Badge variant={ITEM_TONE[r.status] ?? "muted"}>{r.status.replace(/_/g, " ")}</Badge>,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
