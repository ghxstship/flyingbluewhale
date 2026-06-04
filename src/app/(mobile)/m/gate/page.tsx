import Link from "next/link";
import { QrCode } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type ScanRow = {
  id: string;
  result: string;
  reason: string | null;
  scanned_at: string;
  gate_code: string | null;
  venue: { name: string | null } | null;
};

const RESULT_TONE: Record<string, "muted" | "success" | "warning" | "error"> = {
  granted: "success",
  denied: "error",
  expired: "warning",
  unknown: "muted",
};

export default async function MobileGatePage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">
        {t("m.gate.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const fmtTime = (iso: string): string => fmt.time(iso);
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const { data } = await supabase
    .from("access_scans")
    .select("id, result, reason, scanned_at, gate_code, venue:venue_id(name)")
    .eq("org_id", session.orgId)
    .eq("scanned_by", session.userId)
    .gte("scanned_at", dayStart.toISOString())
    .order("scanned_at", { ascending: false })
    .limit(20);
  const rows = (data ?? []) as unknown as ScanRow[];

  const granted = rows.filter((r) => r.result === "granted").length;
  const denied = rows.length - granted;

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--brand-color,var(--org-primary))] uppercase">
        {t("m.gate.eyebrow", undefined, "Field")}
      </div>
      <h1 className="mt-1 text-2xl font-semibold">{t("m.gate.title", undefined, "Gate")}</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        {rows.length === 0
          ? t("m.gate.noScansYet", undefined, "No scans yet today.")
          : t(
              "m.gate.summary",
              { count: rows.length, granted, denied },
              `${rows.length} today · ${granted} granted · ${denied} denied`,
            )}
      </p>

      <Link href="/m/gate/scan" className="btn btn-primary mt-5 flex w-full items-center justify-center gap-2">
        <QrCode size={18} />
        {t("m.gate.openScanner", undefined, "Open scanner")}
      </Link>

      <section className="mt-6">
        <h2 className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
          {t("m.gate.recentScans", undefined, "Recent Scans")}
        </h2>
        <ul className="mt-3 space-y-2">
          {rows.length === 0 ? (
            <li>
              <EmptyState size="compact" title={t("m.gate.empty.title", undefined, "No Scans Logged Today")} />
            </li>
          ) : (
            rows.map((r) => (
              <li key={r.id} className="surface flex items-center justify-between p-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">
                    {r.venue?.name ?? r.gate_code ?? t("m.gate.gateFallback", undefined, "Gate")}
                  </div>
                  {r.reason && <div className="mt-0.5 truncate text-xs text-[var(--text-muted)]">{r.reason}</div>}
                </div>
                <div className="flex flex-none items-center gap-2">
                  <Badge variant={RESULT_TONE[r.result] ?? "muted"}>{r.result}</Badge>
                  <span className="font-mono text-xs text-[var(--text-muted)]">{fmtTime(r.scanned_at)}</span>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
