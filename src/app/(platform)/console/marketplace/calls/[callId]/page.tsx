import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { formatFeeRange, STATUS_TONE } from "@/lib/marketplace";
import { formatDateTime } from "@/lib/i18n/format";
import { CallControls } from "./CallControls";

export const dynamic = "force-dynamic";

type Call = {
  id: string;
  title: string;
  public_slug: string;
  kind: string;
  description: string | null;
  status: string;
  region: string | null;
  venue_type: string | null;
  genre_tags: string[];
  trade_categories: string[];
  performance_date: string | null;
  slot_length_min: number | null;
  fee_min_cents: number | null;
  fee_max_cents: number | null;
  currency: string;
  deadline_at: string | null;
  submission_count: number;
};

export default async function Page({ params }: { params: Promise<{ callId: string }> }) {
  const { callId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("open_calls")
    .select("*")
    .eq("id", callId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!data) return notFound();
  const c = data as Call;

  return (
    <>
      <ModuleHeader
        eyebrow={`Marketplace · ${c.kind.replace("_", " ")}`}
        title={c.title}
        subtitle={[c.region, c.venue_type].filter(Boolean).join(" · ") || undefined}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_TONE[c.status] ?? "muted"}>{c.status}</Badge>
            <Button href={`/console/marketplace/calls/${c.id}/submissions`} size="sm" variant="ghost">
              {c.submission_count} submissions
            </Button>
            <Button href={`/console/marketplace/calls/${c.id}/edit`} size="sm" variant="ghost">
              Edit
            </Button>
          </div>
        }
      />
      <div className="page-content space-y-5">
        <CallControls callId={c.id} status={c.status} publicSlug={c.public_slug} />

        <section className="surface p-5">
          <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Description</h2>
          <div className="text-sm whitespace-pre-wrap text-[var(--text-primary)]">{c.description ?? "—"}</div>
        </section>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="surface p-5">
            <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Eligibility</h2>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-[var(--text-secondary)]">Performance</dt>
              <dd>{c.performance_date ?? "—"}</dd>
              <dt className="text-[var(--text-secondary)]">Slot length</dt>
              <dd>{c.slot_length_min ? `${c.slot_length_min} min` : "—"}</dd>
              <dt className="text-[var(--text-secondary)]">Fee band</dt>
              <dd>{formatFeeRange(c.fee_min_cents, c.fee_max_cents, c.currency)}</dd>
              <dt className="text-[var(--text-secondary)]">Deadline</dt>
              <dd>{c.deadline_at ? formatDateTime(c.deadline_at) : "—"}</dd>
            </dl>
          </div>
          <div className="surface p-5">
            <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Tags</h2>
            <div className="space-y-2">
              <div>
                <p className="mb-1 text-xs text-[var(--text-secondary)]">Genres</p>
                <div className="flex flex-wrap gap-1.5">
                  {c.genre_tags.length === 0 ? (
                    <span className="text-sm text-[var(--text-secondary)]">—</span>
                  ) : (
                    c.genre_tags.map((g) => (
                      <Badge key={g} variant="muted">
                        {g}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs text-[var(--text-secondary)]">Trades</p>
                <div className="flex flex-wrap gap-1.5">
                  {c.trade_categories.length === 0 ? (
                    <span className="text-sm text-[var(--text-secondary)]">—</span>
                  ) : (
                    c.trade_categories.map((t) => (
                      <Badge key={t} variant="muted">
                        {t}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
