import Link from "next/link";
import { PortalRail } from "@/components/Shell";
import { portalNav } from "@/lib/nav";
import { EmptyState } from "@/components/ui/EmptyState";
import { urlFor } from "@/lib/urls";

export const dynamic = "force-dynamic";

/**
 * Promoter Tour P&L — pointer surface to the org-side tour-economics
 * view. The portal user usually wants the rolled-up margin number, not
 * the line-item drill-down, so we show a high-level CTA back to the
 * promoter dashboard P&L + settlements rather than duplicating the
 * full /console reports here.
 */

export default async function PromoterTourPnL({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div className="flex min-h-screen">
      <PortalRail items={portalNav(slug, "promoter")} title="Promoter" />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-semibold">Tour P&amp;L</h1>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Routing economics across the legs on this engagement. For the audited finance roll-up your AM owns the numbers
          — request the closing pack from{" "}
          <Link className="underline" href={urlFor("portal", `/${slug}/messages`)}>
            /p/{slug}/messages
          </Link>
          .
        </p>

        <section className="mt-5 grid gap-3 sm:grid-cols-2">
          <Link href={urlFor("portal", `/${slug}/promoter/co-pro`)} className="surface hover-lift block p-5">
            <div className="text-sm font-semibold">Co-Pro Splits</div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">
              Per-show guarantee + walkout split that drives net.
            </div>
          </Link>
          <Link href={urlFor("portal", `/${slug}/promoter/settlements`)} className="surface hover-lift block p-5">
            <div className="text-sm font-semibold">Settlements</div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">
              Show-night gross, paid attendance, comps, payout, balance due.
            </div>
          </Link>
        </section>

        <div className="mt-6">
          <EmptyState
            size="compact"
            title="Detailed Tour P&L"
            description="The line-item rollup with COGS, marketing spend, and routing variance lives in the org-side finance reports. Ask your AM for the closing pack."
          />
        </div>
      </div>
    </div>
  );
}
