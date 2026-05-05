import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { formatFeeRange } from "@/lib/marketplace";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  public_handle: string;
  act_name: string;
  tagline: string | null;
  bio: string | null;
  genre_tags: string[];
  photo_url: string | null;
  hero_url: string | null;
  video_reel_url: string | null;
  fee_min_cents: number | null;
  fee_max_cents: number | null;
  currency: string;
  travel_radius_km: number | null;
  monthly_listeners: number | null;
  follower_count: number | null;
  rating_avg: number | null;
  rating_count: number;
  is_verified: boolean;
};

export default async function Page({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  if (!hasSupabase) return notFound();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { data } = await supabase.from("public_talent_directory").select("*").eq("public_handle", handle).maybeSingle();
  if (!data) return notFound();
  const t = data as Row;

  return (
    <main className="page-content space-y-6">
      <Breadcrumbs
        items={[
          { label: "Marketplace", href: "/marketplace" },
          { label: "Talent", href: "/marketplace/talent" },
          { label: t.act_name },
        ]}
      />
      <header className="space-y-2">
        <p className="eyebrow">@{t.public_handle}</p>
        <div className="flex items-start gap-2">
          <h1 className="hed-2xl">{t.act_name}</h1>
          {t.is_verified && <Badge variant="success">verified</Badge>}
        </div>
        {t.tagline && <p className="text-base text-[var(--text-secondary)]">{t.tagline}</p>}
        <div className="flex flex-wrap gap-1.5">
          {t.genre_tags.map((g) => (
            <Badge key={g} variant="muted">
              {g}
            </Badge>
          ))}
        </div>
      </header>

      {t.bio && (
        <section className="surface p-5">
          <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Bio</h2>
          <div className="text-sm whitespace-pre-wrap">{t.bio}</div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="surface p-5">
          <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Booking</h2>
          <dl className="space-y-1 text-sm">
            <div>
              <span className="text-[var(--text-secondary)]">Fee band:</span>{" "}
              {formatFeeRange(t.fee_min_cents, t.fee_max_cents, t.currency)}
            </div>
            <div>
              <span className="text-[var(--text-secondary)]">Travel radius:</span>{" "}
              {t.travel_radius_km ? `${t.travel_radius_km} km` : "—"}
            </div>
            <div>
              <span className="text-[var(--text-secondary)]">Rating:</span>{" "}
              {t.rating_avg == null ? "no reviews yet" : `★ ${t.rating_avg} (${t.rating_count})`}
            </div>
          </dl>
        </div>
        <div className="surface p-5">
          <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Reach</h2>
          <dl className="space-y-1 text-sm">
            <div>
              <span className="text-[var(--text-secondary)]">Monthly listeners:</span>{" "}
              {t.monthly_listeners?.toLocaleString() ?? "—"}
            </div>
            <div>
              <span className="text-[var(--text-secondary)]">Followers:</span>{" "}
              {t.follower_count?.toLocaleString() ?? "—"}
            </div>
            <div>
              <span className="text-[var(--text-secondary)]">Reel:</span>{" "}
              {t.video_reel_url ? (
                <a
                  href={t.video_reel_url}
                  target="_blank"
                  rel="noopener"
                  className="font-mono text-[var(--org-primary)]"
                >
                  Watch ↗
                </a>
              ) : (
                "—"
              )}
            </div>
          </dl>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Button href={`/login?redirect=/marketplace/talent/${t.public_handle}/inquire`}>Send Inquiry</Button>
        <Button href="/signup" variant="ghost">
          Need an account?
        </Button>
      </div>
    </main>
  );
}
