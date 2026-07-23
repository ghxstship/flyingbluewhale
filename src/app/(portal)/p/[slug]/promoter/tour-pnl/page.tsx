import Link from "next/link";
import { PortalRail } from "@/components/Shell";
import { portalNav } from "@/lib/nav";
import { EmptyState } from "@/components/ui/EmptyState";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * Promoter Tour P&L — pointer surface to the org-side tour-economics
 * view. The portal user usually wants the rolled-up margin number, not
 * the line-item drill-down, so we show a high-level CTA back to the
 * promoter dashboard P&L + settlements rather than duplicating the
 * full /studio reports here.
 */

export default async function PromoterTourPnL({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t } = await getRequestT();
  return (
    <div className="flex min-h-screen">
      <PortalRail group={portalNav(slug, "promoter")} />
      <div className="flex-1 p-6">
        <h1>{t("p.promoter.tour-pnl.title", undefined, "Tour P&L")}</h1>
        <p className="mt-1 text-xs text-[var(--p-text-2)]">
          {t(
            "p.promoter.tour-pnl.intro",
            undefined,
            "Routing economics across the legs on this engagement. For the audited finance roll-up your AM owns the numbers. Request the closing pack from",
          )}{" "}
          <Link className="underline" href={`/p/${slug}/messages`}>
            /p/{slug}/messages
          </Link>
          .
        </p>

        <section className="mt-5 grid gap-3 sm:grid-cols-2">
          <Link href={`/p/${slug}/promoter/co-pro`} className="surface hover-lift block p-5">
            <div className="text-sm font-semibold">
              {t("p.promoter.tour-pnl.coPro.title", undefined, "Co-Pro Splits")}
            </div>
            <div className="mt-1 text-xs text-[var(--p-text-2)]">
              {t(
                "p.promoter.tour-pnl.coPro.description",
                undefined,
                "Per-show guarantee + walkout split that drives net.",
              )}
            </div>
          </Link>
          <Link href={`/p/${slug}/promoter/settlements`} className="surface hover-lift block p-5">
            <div className="text-sm font-semibold">
              {t("p.promoter.tour-pnl.settlements.title", undefined, "Settlements")}
            </div>
            <div className="mt-1 text-xs text-[var(--p-text-2)]">
              {t(
                "p.promoter.tour-pnl.settlements.description",
                undefined,
                "Show-night gross, paid attendance, comps, payout, balance due.",
              )}
            </div>
          </Link>
        </section>

        <div className="mt-6">
          <EmptyState
            size="compact"
            title={t("p.promoter.tour-pnl.empty.title", undefined, "Detailed Tour P&L")}
            description={t(
              "p.promoter.tour-pnl.empty.description",
              undefined,
              "The line-item rollup with COGS, marketing spend, and routing variance lives in the org-side finance reports. Ask your AM for the closing pack.",
            )}
          />
        </div>
      </div>
    </div>
  );
}
