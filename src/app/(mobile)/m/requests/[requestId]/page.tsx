import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { ServiceRequest } from "@/lib/supabase/types";
import { transitionRequest } from "@/app/(platform)/console/services/requests/actions";
import { getRequestFormatters } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

const SEV: Record<ServiceRequest["severity"], "error" | "warning" | "info" | "muted"> = {
  P1: "error",
  P2: "warning",
  P3: "info",
  P4: "muted",
};

const STATUS: Record<ServiceRequest["status"], "warning" | "info" | "success" | "muted"> = {
  open: "warning",
  acknowledged: "info",
  in_progress: "info",
  resolved: "success",
  cancelled: "muted",
};

const NEXT_STATES: Record<
  ServiceRequest["status"],
  Array<{ value: "acknowledged" | "in_progress" | "resolved" | "cancelled"; label: string }>
> = {
  open: [
    { value: "acknowledged", label: "Acknowledge" },
    { value: "in_progress", label: "Start Work" },
  ],
  acknowledged: [
    { value: "in_progress", label: "Start Work" },
    { value: "resolved", label: "Resolve" },
  ],
  in_progress: [{ value: "resolved", label: "Resolve" }],
  resolved: [],
  cancelled: [],
};

export default async function Page({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const { data: row } = await supabase
    .from("service_requests")
    .select("*")
    .eq("org_id", session.orgId)
    .eq("id", requestId)
    .maybeSingle();
  if (!row) notFound();
  const r = row as ServiceRequest;

  return (
    <div className="px-4 pt-6 pb-24">
      <Link href="/m/requests" className="text-xs text-[var(--text-muted)]">
        ← Requests
      </Link>
      <h1 className="mt-2 text-xl leading-snug font-semibold">{r.summary}</h1>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant={SEV[r.severity]}>{toTitle(r.severity)}</Badge>
        <Badge variant={STATUS[r.status]}>{r.status.replace("_", " ")}</Badge>
        <span className="font-mono text-[10px] text-[var(--text-muted)]">{r.category}</span>
      </div>
      {r.description && <div className="surface mt-4 p-4 text-sm whitespace-pre-wrap">{r.description}</div>}
      <div className="surface mt-4 grid grid-cols-2 gap-3 p-4 text-xs">
        <div>
          <div className="tracking-wide text-[var(--text-muted)] uppercase">Opened</div>
          <div className="font-mono">{fmt.dateTime(r.opened_at)}</div>
        </div>
        <div>
          <div className="tracking-wide text-[var(--text-muted)] uppercase">Response SLA</div>
          <div className="font-mono">
            {r.sla_response_due ? fmt.dateTime(r.sla_response_due) : "—"}
            {r.sla_response_breached && (
              <Badge variant="error" className="ml-1">
                !
              </Badge>
            )}
          </div>
        </div>
      </div>
      {NEXT_STATES[r.status].length > 0 && (
        <div className="mt-5 space-y-2">
          <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">Update</div>
          <div className="grid grid-cols-2 gap-2">
            {NEXT_STATES[r.status].map((t) => (
              <form key={t.value} action={transitionRequest.bind(null, requestId)}>
                <input type="hidden" name="to" value={t.value} />
                <Button type="submit" variant="secondary" size="md" className="w-full">
                  {t.label}
                </Button>
              </form>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
