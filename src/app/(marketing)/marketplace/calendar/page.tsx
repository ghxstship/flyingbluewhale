import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { buildMetadata } from "@/lib/seo";
import { STATUS_TONE } from "@/lib/marketplace";
import { toTitle } from "@/lib/format";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.marketplace.calendar.meta.title", undefined, "Event Calendar — On-sales + Announces"),
    description: t(
      "marketing.marketplace.calendar.meta.description",
      undefined,
      "Upcoming on-sale dates, presale windows, and announcements.",
    ),
    path: "/marketplace/calendar",
  });
}

type Row = { id: string; kind: string; label: string | null; occurs_at: string; org_name: string; org_slug: string };

export default async function Page() {
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();
  let rows: Row[] = [];
  if (hasSupabase) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("public_event_calendar")
      .select("*")
      .order("occurs_at", { ascending: true })
      .limit(120);
    rows = (data ?? []) as Row[];
  }

  const byDay = rows.reduce<Record<string, Row[]>>((acc, r) => {
    const day = r.occurs_at.slice(0, 10);
    (acc[day] ??= []).push(r);
    return acc;
  }, {});
  const days = Object.keys(byDay).sort();
  const count = rows.length;
  const summary =
    count === 1
      ? t("marketing.marketplace.calendar.summary.one", { count }, "{count} upcoming announcement + on-sale milestone")
      : t(
          "marketing.marketplace.calendar.summary.many",
          { count },
          "{count} upcoming announcements + on-sale milestones",
        );

  return (
    <>
      <Breadcrumbs
        items={[
          {
            label: t("marketing.marketplace.crumbsLabel", undefined, "Marketplace"),
            href: "/marketplace",
          },
          { label: t("marketing.marketplace.calendar.crumbsLabel", undefined, "Calendar") },
        ]}
        className="mx-auto max-w-6xl px-6 pt-6"
      />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">
          {t("marketing.marketplace.calendar.eyebrow", undefined, "Marketplace · Calendar")}
        </div>
        <h1 className="hed-2xl mt-4">{t("marketing.marketplace.calendar.title", undefined, "Event Calendar")}</h1>
        <p className="mt-3 text-sm text-[var(--p-text-2)]">{summary}</p>
      </section>

      <section className="mx-auto max-w-6xl space-y-6 px-6 pb-16">
        {days.length === 0 ? (
          <div className="surface p-6 text-sm text-[var(--p-text-2)]">
            {t("marketing.marketplace.calendar.empty", undefined, "No public milestones in the upcoming window.")}
          </div>
        ) : (
          days.map((d) => (
            <div key={d} className="surface p-5">
              <h2 className="mb-2 font-mono text-sm text-[var(--p-text-2)]">{new Date(d).toDateString()}</h2>
              <ul className="divide-y divide-[var(--border-subtle)]">
                {(byDay[d] ?? []).map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                    <div className="flex items-center gap-3">
                      <Badge variant={STATUS_TONE[r.kind] ?? "muted"}>{toTitle(r.kind)}</Badge>
                      <span>{r.label ?? r.org_name}</span>
                    </div>
                    <span className="font-mono text-xs text-[var(--p-text-2)]">
                      {fmt.time(new Date(r.occurs_at))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </>
  );
}
