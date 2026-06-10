import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { ServiceRequest } from "@/lib/supabase/types";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

const SEV: Record<ServiceRequest["severity"], "error" | "warning" | "info" | "muted"> = {
  P1: "error",
  P2: "warning",
  P3: "info",
  P4: "muted",
};

export default async function MobileRequests() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div className="px-4 pt-6 pb-24 text-sm text-[var(--p-text-2)]">
        {t("common.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const { data } = await supabase
    .from("service_requests")
    .select("id, severity, category, summary, request_state, opened_at")
    .eq("org_id", session.orgId)
    .neq("request_state", "resolved")
    .neq("request_state", "cancelled")
    .order("opened_at", { ascending: false })
    .limit(50);
  const rows = (data ?? []) as Pick<
    ServiceRequest,
    "id" | "severity" | "category" | "summary" | "request_state" | "opened_at"
  >[];

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--p-accent)] uppercase">
        {t("m.requests.eyebrow", undefined, "Field")}
      </div>
      <div className="mt-1 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("m.requests.title", undefined, "Service Requests")}</h1>
        <Link href="/m/requests/new" className="ps-btn ps-btn--sm">
          {t("m.requests.openCta", undefined, "+ Open")}
        </Link>
      </div>
      <p className="mt-1 text-xs text-[var(--p-text-2)]">
        {t("m.requests.subtitle", undefined, "Active requests across the org.")}
      </p>

      <ul className="mt-5 space-y-2">
        {rows.length === 0 ? (
          <li>
            <EmptyState
              size="compact"
              title={t("m.requests.empty.title", undefined, "Nothing Open")}
              description={t("m.requests.empty.description", undefined, "All quiet right now.")}
            />
          </li>
        ) : (
          rows.map((r) => (
            <li key={r.id}>
              <Link href={`/m/requests/${r.id}`} className="surface flex flex-col gap-1 p-4">
                <div className="flex items-center gap-2">
                  <Badge variant={SEV[r.severity]}>{toTitle(r.severity)}</Badge>
                  <span className="font-mono text-[10px] text-[var(--p-text-2)]">{r.category}</span>
                  <span className="ms-auto font-mono text-[10px] text-[var(--p-text-2)]">{fmt.time(r.opened_at)}</span>
                </div>
                <div className="text-sm font-medium">{r.summary}</div>
                <div className="font-mono text-[10px] text-[var(--p-text-2)]">{toTitle(r.request_state)}</div>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
