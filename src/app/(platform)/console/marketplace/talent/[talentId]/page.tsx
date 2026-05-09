import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { formatFeeRange } from "@/lib/marketplace";
import { TalentVisibility } from "./TalentVisibility";

export const dynamic = "force-dynamic";

type Talent = {
  id: string;
  act_name: string;
  public_handle: string | null;
  tagline: string | null;
  bio: string | null;
  genre_tags: string[];
  fee_min_cents: number | null;
  fee_max_cents: number | null;
  currency: string;
  travel_radius_km: number | null;
  deposit_pct: number;
  agent_name: string | null;
  agent_email: string | null;
  video_reel_url: string | null;
  is_public: boolean;
  verified_at: string | null;
  rating_avg: number | null;
  rating_count: number;
};

export default async function Page({ params }: { params: Promise<{ talentId: string }> }) {
  const { talentId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { data } = await supabase
    .from("talent_profiles")
    .select("*")
    .eq("id", talentId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) return notFound();
  const t = data as Talent;

  const ridersResp = await supabase
    .from("talent_riders")
    .select("id, kind, version, is_current")
    .eq("talent_profile_id", t.id)
    .order("kind");
  const riders = (ridersResp.data ?? []) as Array<{ id: string; kind: string; version: number; is_current: boolean }>;

  return (
    <>
      <ModuleHeader
        eyebrow="Marketplace · Talent"
        title={t.act_name}
        subtitle={t.tagline ?? undefined}
        action={
          <div className="flex items-center gap-2">
            {t.verified_at && <Badge variant="success">verified</Badge>}
            <Badge variant={t.is_public ? "success" : "muted"}>{t.is_public ? "public" : "private"}</Badge>
            <Button href={`/console/marketplace/talent/${t.id}/riders`} size="sm" variant="ghost">
              Riders
            </Button>
            <Button href={`/console/marketplace/talent/${t.id}/edit`} size="sm" variant="ghost">
              Edit
            </Button>
          </div>
        }
      />
      <div className="page-content space-y-5">
        <TalentVisibility talentId={t.id} isPublic={t.is_public} publicHandle={t.public_handle} />

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="surface p-5">
            <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Bio</h2>
            <div className="text-sm whitespace-pre-wrap">{t.bio ?? "—"}</div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {t.genre_tags.map((g) => (
                <Badge key={g} variant="muted">
                  {g}
                </Badge>
              ))}
            </div>
          </div>
          <div className="surface p-5">
            <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Booking</h2>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-[var(--text-secondary)]">Fee band</dt>
              <dd>{formatFeeRange(t.fee_min_cents, t.fee_max_cents, t.currency)}</dd>
              <dt className="text-[var(--text-secondary)]">Travel radius</dt>
              <dd>{t.travel_radius_km ? `${t.travel_radius_km} km` : "—"}</dd>
              <dt className="text-[var(--text-secondary)]">Deposit</dt>
              <dd>{t.deposit_pct}%</dd>
              <dt className="text-[var(--text-secondary)]">Agent</dt>
              <dd>
                {t.agent_name ?? "—"}
                {t.agent_email ? ` <${t.agent_email}>` : ""}
              </dd>
              <dt className="text-[var(--text-secondary)]">Reel</dt>
              <dd>
                {t.video_reel_url ? (
                  <a
                    href={t.video_reel_url}
                    target="_blank"
                    rel="noopener"
                    className="font-mono text-xs text-[var(--org-primary)]"
                  >
                    Watch ↗
                  </a>
                ) : (
                  "—"
                )}
              </dd>
              <dt className="text-[var(--text-secondary)]">Rating</dt>
              <dd>{t.rating_avg == null ? "no reviews yet" : `★ ${t.rating_avg} (${t.rating_count})`}</dd>
            </dl>
          </div>
        </section>

        <section className="surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide uppercase">Current Riders</h2>
            <Button href={`/console/marketplace/talent/${t.id}/riders/new`} size="sm" variant="ghost">
              + Add Rider
            </Button>
          </div>
          {riders.length === 0 ? (
            <EmptyState size="compact" title="No riders attached yet" />
          ) : (
            <ul className="divide-y divide-[var(--border-subtle)] text-sm">
              {riders.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2">
                  <span className="capitalize">
                    {r.kind.replace("_", " ")} · v{r.version}
                  </span>
                  {r.is_current && <Badge variant="success">current</Badge>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
