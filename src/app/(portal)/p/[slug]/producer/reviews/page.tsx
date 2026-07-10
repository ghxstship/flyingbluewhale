import { EmptyState } from "@/components/ui/EmptyState";
import { PortalRail } from "@/components/Shell";
import { portalNav } from "@/lib/nav";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * Producer reviews — scheduled program reviews (gate reviews, retros, board
 * check-ins) for the org, newest first. Sourced from `program_reviews`.
 */

type Review = {
  id: string;
  title: string | null;
  scheduled_at: string | null;
  decisions: string | null;
  notes: string | null;
};

export default async function ProducerReviews({ params }: { params: Promise<{ slug: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="page-content">{t("p.producer.reviews.configureSupabase", undefined, "Configure Supabase.")}</div>
    );
  const { slug } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("program_reviews")
    .select("id, title, scheduled_at, decisions, notes")
    .eq("org_id", session.orgId)
    .order("scheduled_at", { ascending: false, nullsFirst: false })
    .limit(100);
  const rows = (data ?? []) as Review[];

  return (
    <div className="flex min-h-screen">
      <PortalRail group={portalNav(slug, "producer")} />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-semibold">{t("p.producer.reviews.title", undefined, "Reviews")}</h1>
        <p className="mt-1 text-xs text-[var(--p-text-2)]">
          {t("p.producer.reviews.subtitle", undefined, "Gate reviews, retros, and board check-ins.")}
        </p>

        {rows.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              title={t("p.producer.reviews.empty.title", undefined, "No Reviews Scheduled")}
              description={t(
                "p.producer.reviews.empty.description",
                undefined,
                "Program reviews scheduled for this organization will appear here.",
              )}
            />
          </div>
        ) : (
          <ul className="mt-5 space-y-2">
            {rows.map((r) => (
              <li key={r.id} className="surface p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold">{r.title ?? t("p.producer.reviews.untitled", undefined, "Untitled review")}</div>
                  {r.scheduled_at && (
                    <span className="font-mono text-[11px] text-[var(--p-text-2)]">{fmt.date(r.scheduled_at)}</span>
                  )}
                </div>
                {r.decisions && <p className="mt-1 text-xs text-[var(--p-text-2)]">{r.decisions}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
