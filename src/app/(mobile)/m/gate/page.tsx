import Link from "next/link";
import { QrCode } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

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

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export default async function MobileGatePage() {
  if (!hasSupabase) {
    return <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">Configure Supabase.</div>;
  }
  const session = await requireSession();
  const supabase = await createClient();

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
        Field
      </div>
      <h1 className="mt-1 text-2xl font-semibold">Gate</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        {rows.length === 0 ? "No scans yet today." : `${rows.length} today · ${granted} granted · ${denied} denied`}
      </p>

      <Link href="/m/gate/scan" className="btn btn-primary mt-5 flex w-full items-center justify-center gap-2">
        <QrCode size={18} />
        Open scanner
      </Link>

      <section className="mt-6">
        <h2 className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">Recent scans</h2>
        <ul className="mt-3 space-y-2">
          {rows.length === 0 ? (
            <li>
              <EmptyState size="compact" title="No scans logged today" />
            </li>
          ) : (
            rows.map((r) => (
              <li key={r.id} className="surface flex items-center justify-between p-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{r.venue?.name ?? r.gate_code ?? "Gate"}</div>
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
