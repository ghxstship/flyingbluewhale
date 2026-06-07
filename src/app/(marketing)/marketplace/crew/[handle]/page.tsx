import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { formatFeeRange } from "@/lib/marketplace";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  public_handle: string;
  name: string;
  tagline: string | null;
  bio: string | null;
  roles: string[];
  unions: string[];
  certifications: string[];
  day_rate_min_cents: number | null;
  day_rate_max_cents: number | null;
  travel_radius_km: number | null;
  availability_open: boolean;
  rating_avg: number | null;
  rating_count: number;
  is_verified: boolean;
  reel_url: string | null;
  photo_url: string | null;
};

export default async function Page({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  if (!hasSupabase) return notFound();
  const supabase = await createClient();
  const { data } = await supabase.from("public_crew_directory").select("*").eq("public_handle", handle).maybeSingle();
  if (!data) return notFound();
  const c = data as Row;
  const { t } = await getRequestT();

  return (
    <>
      <Breadcrumbs
        items={[
          { label: t("marketing.pages.marketplace-crew-handle.breadcrumbs.marketplace"), href: "/marketplace" },
          { label: t("marketing.pages.marketplace-crew-handle.breadcrumbs.crew"), href: "/marketplace/crew" },
          { label: c.name },
        ]}
        className="mx-auto max-w-6xl px-6 pt-6"
      />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">@{c.public_handle}</div>
        <div className="mt-4 flex items-start gap-3">
          <h1 className="hed-2xl">{c.name}</h1>
          {c.is_verified && (
            <Badge variant="success">{t("marketing.pages.marketplace-crew-handle.badges.verified")}</Badge>
          )}
          {c.availability_open && (
            <Badge variant="info">{t("marketing.pages.marketplace-crew-handle.badges.available")}</Badge>
          )}
        </div>
        {c.tagline && <p className="mt-5 max-w-2xl text-lg text-[var(--p-text-2)]">{c.tagline}</p>}
      </section>

      <section className="mx-auto max-w-6xl space-y-6 px-6 pb-16">
        {c.bio && (
          <div className="surface p-5">
            <h2 className="hed-md mb-3">{t("marketing.pages.marketplace-crew-handle.sections.bio")}</h2>
            <div className="text-sm whitespace-pre-wrap">{c.bio}</div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="surface p-5">
            <h2 className="hed-md mb-3">{t("marketing.pages.marketplace-crew-handle.sections.roles")}</h2>
            <div className="flex flex-wrap gap-1.5">
              {c.roles.length === 0 ? (
                <span className="text-sm text-[var(--p-text-2)]">—</span>
              ) : (
                c.roles.map((r) => (
                  <Badge key={r} variant="muted">
                    {r}
                  </Badge>
                ))
              )}
            </div>
          </div>
          <div className="surface p-5">
            <h2 className="hed-md mb-3">{t("marketing.pages.marketplace-crew-handle.sections.unions")}</h2>
            <div className="flex flex-wrap gap-1.5">
              {c.unions.length === 0 ? (
                <span className="text-sm text-[var(--p-text-2)]">—</span>
              ) : (
                c.unions.map((u) => (
                  <Badge key={u} variant="muted">
                    {u}
                  </Badge>
                ))
              )}
            </div>
          </div>
          <div className="surface p-5">
            <h2 className="hed-md mb-3">{t("marketing.pages.marketplace-crew-handle.sections.certs")}</h2>
            <div className="flex flex-wrap gap-1.5">
              {c.certifications.length === 0 ? (
                <span className="text-sm text-[var(--p-text-2)]">—</span>
              ) : (
                c.certifications.map((cert) => (
                  <Badge key={cert} variant="muted">
                    {cert}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="surface p-5">
          <h2 className="hed-md mb-3">{t("marketing.pages.marketplace-crew-handle.booking.title")}</h2>
          <dl className="space-y-1 text-sm">
            <div>
              <span className="text-[var(--p-text-2)]">
                {t("marketing.pages.marketplace-crew-handle.booking.dayRate")}
              </span>{" "}
              {formatFeeRange(c.day_rate_min_cents, c.day_rate_max_cents, "USD")}
            </div>
            <div>
              <span className="text-[var(--p-text-2)]">
                {t("marketing.pages.marketplace-crew-handle.booking.travelRadius")}
              </span>{" "}
              {c.travel_radius_km ? `${c.travel_radius_km} km` : "—"}
            </div>
            <div>
              <span className="text-[var(--p-text-2)]">
                {t("marketing.pages.marketplace-crew-handle.booking.reel")}
              </span>{" "}
              {c.reel_url ? (
                <a href={c.reel_url} target="_blank" rel="noopener" className="font-mono text-[var(--p-accent)]">
                  {t("marketing.pages.marketplace-crew-handle.booking.watch")}
                </a>
              ) : (
                "—"
              )}
            </div>
            <div>
              <span className="text-[var(--p-text-2)]">
                {t("marketing.pages.marketplace-crew-handle.booking.rating")}
              </span>{" "}
              {c.rating_avg == null
                ? t("marketing.pages.marketplace-crew-handle.booking.noReviews")
                : `★ ${c.rating_avg} (${c.rating_count})`}
            </div>
          </dl>
        </div>

        <div className="flex items-center gap-3">
          <Button href={`/login?redirect=/marketplace/crew/${c.public_handle}/inquire`}>
            {t("marketing.pages.marketplace-crew-handle.cta.sendInquiry")}
          </Button>
          <Button href="/signup" variant="ghost">
            {t("marketing.pages.marketplace-crew-handle.cta.needAccount")}
          </Button>
        </div>
      </section>
    </>
  );
}
