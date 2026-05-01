import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

type Member = {
  id: string;
  full_name: string;
  metadata: unknown;
};

type Sizing = {
  size_top?: string;
  size_bottom?: string;
  size_shoes?: string;
  pickup_slot?: string;
  pickup_status?: string;
  notes?: string;
};

function metaToSizing(raw: unknown): Sizing {
  if (!raw || typeof raw !== "object") return {};
  const m = raw as Record<string, unknown>;
  return {
    size_top: typeof m.size_top === "string" ? m.size_top : undefined,
    size_bottom: typeof m.size_bottom === "string" ? m.size_bottom : undefined,
    size_shoes: typeof m.size_shoes === "string" ? m.size_shoes : undefined,
    pickup_slot: typeof m.pickup_slot === "string" ? m.pickup_slot : undefined,
    pickup_status: typeof m.pickup_status === "string" ? m.pickup_status : undefined,
    notes: typeof m.notes === "string" ? m.notes : undefined,
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Portal" title="Uniform" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("workforce_members")
    .select("id, full_name, metadata")
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId)
    .maybeSingle();

  const member = data as Member | null;
  const sizing = metaToSizing(member?.metadata);
  const ready = Boolean(sizing.size_top && sizing.size_bottom);

  return (
    <>
      <ModuleHeader
        eyebrow="Portal · Volunteer"
        title="Uniform"
        subtitle={member ? `Issue tracking for ${member.full_name}` : "Sign-in required"}
        breadcrumbs={[
          { label: "Portal", href: `/p/${slug}` },
          { label: "Volunteer", href: `/p/${slug}/volunteer` },
          { label: "Uniform" },
        ]}
        action={
          <Badge variant={sizing.pickup_status === "collected" ? "success" : ready ? "info" : "warning"}>
            {sizing.pickup_status ?? (ready ? "ready" : "sizes needed")}
          </Badge>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Sizing on file" value={ready ? "Yes" : "No"} accent={ready} />
          <MetricCard label="Pickup slot" value={sizing.pickup_slot ?? "TBD"} />
          <MetricCard label="Status" value={sizing.pickup_status ?? "pending"} />
        </div>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">Your Sizing</h3>
          {!member ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Submit your volunteer application first — sizing data lives on your workforce profile.
            </p>
          ) : (
            <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-[var(--text-muted)]">Top</dt>
              <dd>{sizing.size_top ?? "—"}</dd>
              <dt className="text-[var(--text-muted)]">Bottom</dt>
              <dd>{sizing.size_bottom ?? "—"}</dd>
              <dt className="text-[var(--text-muted)]">Shoes</dt>
              <dd>{sizing.size_shoes ?? "—"}</dd>
              <dt className="text-[var(--text-muted)]">Notes</dt>
              <dd className="text-xs">{sizing.notes ?? "—"}</dd>
            </dl>
          )}
        </section>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">Pickup</h3>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">
            Pickup happens at the Workforce Centre. Bring your ID and accreditation. Allow 30 minutes for fitting and
            collection.
          </p>
          {sizing.pickup_slot ? (
            <p className="mt-3 font-mono text-sm">
              Slot: <strong>{sizing.pickup_slot}</strong>
            </p>
          ) : (
            <p className="mt-3 text-xs text-[var(--text-muted)]">
              Slot not yet booked — your team lead will assign one based on your shift schedule.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
