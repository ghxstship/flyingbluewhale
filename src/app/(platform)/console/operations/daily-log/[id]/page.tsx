import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { ConversationPanel } from "@/components/ConversationPanel";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { transitionDailyLog } from "./actions";
import { StatusForm } from "@/components/StatusForm";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, "muted" | "info" | "success"> = {
  draft: "muted",
  submitted: "info",
  approved: "success",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const fmtDate = (d: string): string =>
    fmt.dateParts(d + "T00:00:00", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  const { data: log } = await supabase
    .from("daily_logs")
    .select("*, project:project_id(name)")
    .eq("org_id", session.orgId)
    .eq("id", id)
    .maybeSingle();
  if (!log) notFound();

  const [{ data: manpower }, { data: equipment }, { data: deliveries }, { data: visitors }] = await Promise.all([
    supabase.from("daily_log_manpower").select("*").eq("daily_log_id", id).order("trade"),
    supabase.from("daily_log_equipment").select("*").eq("daily_log_id", id),
    supabase.from("daily_log_deliveries").select("*").eq("daily_log_id", id).order("arrived_at"),
    supabase.from("daily_log_visitors").select("*").eq("daily_log_id", id).order("arrived_at"),
  ]);

  const totalHeadcount = (manpower ?? []).reduce((s, m) => s + (m.headcount ?? 0), 0);
  const totalHours = (manpower ?? []).reduce((s, m) => s + Number(m.hours_worked ?? 0), 0);
  const projectName = (log.project as unknown as { name: string | null } | null)?.name ?? "—";

  return (
    <>
      <ModuleHeader
        eyebrow="Operations"
        breadcrumbs={[{ label: "Daily Log", href: "/console/operations/daily-log" }, { label: fmtDate(log.log_date) }]}
        title={fmtDate(log.log_date)}
        subtitle={projectName}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_TONE[log.status] ?? "muted"}>{log.status}</Badge>
            {log.status === "draft" && (
              <StatusForm action={transitionDailyLog.bind(null, id, "submitted")} label="Submit" />
            )}
            {log.status === "submitted" && (
              <StatusForm action={transitionDailyLog.bind(null, id, "approved")} label="Approve" />
            )}
          </div>
        }
      />
      <div className="page-content space-y-5">
        <section className="grid gap-4 md:grid-cols-3">
          <div className="surface p-4">
            <div className="text-xs font-semibold tracking-wide text-[var(--text-muted)] uppercase">Weather</div>
            <p className="mt-2 text-sm">{log.weather_summary ?? "—"}</p>
            {(log.weather_temp_high_f != null || log.weather_temp_low_f != null) && (
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {log.weather_temp_high_f ?? "—"}°F high / {log.weather_temp_low_f ?? "—"}°F low
              </p>
            )}
          </div>
          <div className="surface p-4">
            <div className="text-xs font-semibold tracking-wide text-[var(--text-muted)] uppercase">Manpower</div>
            <p className="mt-2 text-2xl font-semibold">{totalHeadcount}</p>
            <p className="text-xs text-[var(--text-muted)]">
              {totalHours.toFixed(1)} hrs across {(manpower ?? []).length} trades
            </p>
          </div>
          <div className="surface p-4">
            <div className="text-xs font-semibold tracking-wide text-[var(--text-muted)] uppercase">Activity</div>
            <p className="mt-2 text-sm">
              {(deliveries ?? []).length} deliveries · {(visitors ?? []).length} visitors · {(equipment ?? []).length}{" "}
              equipment entries
            </p>
          </div>
        </section>

        {log.notes && (
          <section className="surface p-4">
            <h3 className="text-sm font-semibold">Site Narrative</h3>
            <p className="mt-2 text-sm whitespace-pre-wrap">{log.notes}</p>
          </section>
        )}

        <section className="surface p-4">
          <h3 className="text-sm font-semibold">Manpower</h3>
          {(manpower ?? []).length === 0 ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">No manpower entries.</p>
          ) : (
            <table className="data-table mt-3">
              <thead>
                <tr>
                  <th>Trade</th>
                  <th>Headcount</th>
                  <th>Hours</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {(manpower ?? []).map((m) => (
                  <tr key={m.id}>
                    <td>{m.trade}</td>
                    <td className="font-mono text-xs">{m.headcount}</td>
                    <td className="font-mono text-xs">{Number(m.hours_worked).toFixed(1)}</td>
                    <td>{m.notes ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <ConversationPanel orgId={session.orgId} recordType="daily_log" recordId={id} />
      </div>
    </>
  );
}
