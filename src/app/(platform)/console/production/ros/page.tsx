import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { CueForm, CueRow } from "./CueForm";
import type { Cue } from "@/lib/supabase/types";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function RunOfShowPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.production.ros.eyebrow", undefined, "Production")}
          title={t("console.production.ros.title", undefined, "Run of Show")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.production.ros.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const { data } = await supabase
    .from("cues")
    .select("id, scheduled_at, lane, label, description, cue_state, duration_seconds, owner_id")
    .eq("org_id", session.orgId)
    .order("scheduled_at", { ascending: true })
    .limit(500);
  const rows = (data ?? []) as Cue[];

  const grouped = new Map<string, Cue[]>();
  for (const r of rows) {
    const key = r.scheduled_at.slice(0, 10);
    const list = grouped.get(key) ?? [];
    list.push(r);
    grouped.set(key, list);
  }

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.production.ros.eyebrow", undefined, "Production")}
        title={t("console.production.ros.title", undefined, "Run of Show")}
        subtitle={
          rows.length === 1
            ? t("console.production.ros.subtitleOne", { count: rows.length }, `${rows.length} cue on the show plan`)
            : t("console.production.ros.subtitleOther", { count: rows.length }, `${rows.length} cues on the show plan`)
        }
      />
      <div className="page-content max-w-5xl space-y-5">
        <section className="surface p-5">
          <h3 className="text-sm font-semibold">{t("console.production.ros.addCue", undefined, "Add a Cue")}</h3>
          <p className="mt-1 text-xs text-[var(--p-text-2)]">
            {t(
              "console.production.ros.addCueHint",
              undefined,
              "Cues live across departments. Status flows Pending → Standby → Live → Done.",
            )}
          </p>
          <div className="mt-4">
            <CueForm />
          </div>
        </section>

        {grouped.size === 0 ? (
          <section className="surface p-8 text-center text-sm text-[var(--p-text-2)]">
            {t("console.production.ros.empty", undefined, "No cues yet — author one above.")}
          </section>
        ) : (
          Array.from(grouped.entries()).map(([day, cues]) => (
            <section key={day} className="surface">
              <header className="flex items-center justify-between border-b border-[var(--p-border)] px-4 py-2.5">
                <h3 className="text-sm font-semibold">
                  {fmt.dateParts(day, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </h3>
                <Badge variant="muted">
                  {cues.length === 1
                    ? t("console.production.ros.countOne", { count: cues.length }, `${cues.length} cue`)
                    : t("console.production.ros.countOther", { count: cues.length }, `${cues.length} cues`)}
                </Badge>
              </header>
              <table className="ps-table w-full text-sm">
                <thead>
                  <tr>
                    <th>{t("console.production.ros.col.time", undefined, "Time")}</th>
                    <th>{t("console.production.ros.col.lane", undefined, "Lane")}</th>
                    <th>{t("console.production.ros.col.cue", undefined, "Cue")}</th>
                    <th>{t("console.production.ros.col.cue_state", undefined, "Status")}</th>
                    <th className="text-end">{t("console.production.ros.col.actions", undefined, "Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {cues.map((c) => (
                    <CueRow key={c.id} cue={c} />
                  ))}
                </tbody>
              </table>
            </section>
          ))
        )}
      </div>
    </>
  );
}
