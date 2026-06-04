import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { ServiceRequest, ServiceRequestEvent } from "@/lib/supabase/types";
import { transitionRequest } from "../actions";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
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
  Array<{
    value: "acknowledged" | "in_progress" | "resolved" | "cancelled";
    label: string;
    variant?: "primary" | "secondary" | "danger";
  }>
> = {
  open: [
    { value: "acknowledged", label: "Acknowledge" },
    { value: "in_progress", label: "Start Work" },
    { value: "cancelled", label: "Cancel", variant: "danger" },
  ],
  acknowledged: [
    { value: "in_progress", label: "Start Work" },
    { value: "resolved", label: "Resolve" },
    { value: "cancelled", label: "Cancel", variant: "danger" },
  ],
  in_progress: [
    { value: "resolved", label: "Resolve" },
    { value: "cancelled", label: "Cancel", variant: "danger" },
  ],
  resolved: [],
  cancelled: [],
};

export default async function Page({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title={t("console.services.requests.detail.title", undefined, "Service Request")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.services.requests.detail.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
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

  const { data: eventsData } = await supabase
    .from("service_request_events")
    .select("id, kind, payload, occurred_at, actor_id")
    .eq("request_id", requestId)
    .order("occurred_at", { ascending: false })
    .limit(50);
  const events = (eventsData ?? []) as ServiceRequestEvent[];

  const transitions = NEXT_STATES[r.status];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.services.requests.detail.eyebrow", undefined, "Services · Request")}
        title={r.summary}
        action={
          <Button href="/console/services/requests" variant="ghost" size="sm">
            {t("common.back", undefined, "Back")}
          </Button>
        }
      />
      <div className="page-content max-w-3xl space-y-5">
        <div className="surface p-5">
          <div className="flex items-center gap-3">
            <Badge variant={SEV[r.severity]}>{toTitle(r.severity)}</Badge>
            <Badge variant={STATUS[r.status]}>{toTitle(r.status)}</Badge>
            <span className="font-mono text-xs text-[var(--text-muted)]">{r.category}</span>
          </div>
          {r.description && (
            <p className="mt-4 text-sm whitespace-pre-wrap text-[var(--text-secondary)]">{r.description}</p>
          )}
          <dl className="mt-5 grid grid-cols-2 gap-3 text-xs">
            <div>
              <dt className="tracking-wide text-[var(--text-muted)] uppercase">
                {t("console.services.requests.detail.opened", undefined, "Opened")}
              </dt>
              <dd className="font-mono">{fmt.dateTime(r.opened_at)}</dd>
            </div>
            <div>
              <dt className="tracking-wide text-[var(--text-muted)] uppercase">
                {t("console.services.requests.detail.responseSla", undefined, "Response SLA")}
              </dt>
              <dd className="font-mono">
                {r.sla_response_due ? fmt.dateTime(r.sla_response_due) : "—"}
                {r.sla_response_breached && (
                  <Badge variant="error" className="ms-2">
                    {t("console.services.requests.detail.breached", undefined, "breached")}
                  </Badge>
                )}
              </dd>
            </div>
            <div>
              <dt className="tracking-wide text-[var(--text-muted)] uppercase">
                {t("console.services.requests.detail.resolutionSla", undefined, "Resolution SLA")}
              </dt>
              <dd className="font-mono">
                {r.sla_resolution_due ? fmt.dateTime(r.sla_resolution_due) : "—"}
                {r.sla_resolution_breached && (
                  <Badge variant="error" className="ms-2">
                    {t("console.services.requests.detail.breached", undefined, "breached")}
                  </Badge>
                )}
              </dd>
            </div>
            <div>
              <dt className="tracking-wide text-[var(--text-muted)] uppercase">
                {t("console.services.requests.detail.acknowledged", undefined, "Acknowledged")}
              </dt>
              <dd className="font-mono">{r.acknowledged_at ? fmt.dateTime(r.acknowledged_at) : "—"}</dd>
            </div>
          </dl>
        </div>

        {transitions.length > 0 && (
          <div className="surface p-5">
            <h3 className="text-sm font-semibold">
              {t("console.services.requests.detail.transition", undefined, "Transition")}
            </h3>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {transitions.map((tr) => (
                <form key={tr.value} action={transitionRequest.bind(null, requestId)}>
                  <input type="hidden" name="to" value={tr.value} />
                  {tr.value === "resolved" && (
                    <input
                      name="note"
                      placeholder={t(
                        "console.services.requests.detail.resolutionNotePlaceholder",
                        undefined,
                        "Resolution note (optional)",
                      )}
                      maxLength={2000}
                      className="input-base me-2 inline-block w-64 align-middle"
                    />
                  )}
                  <Button type="submit" variant={tr.variant ?? "secondary"} size="sm">
                    {t(`console.services.requests.detail.action.${tr.value}`, undefined, tr.label)}
                  </Button>
                </form>
              ))}
            </div>
          </div>
        )}

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">
            {t("console.services.requests.detail.timeline", undefined, "Timeline")}
          </h3>
          <ol className="mt-3 space-y-3 text-xs">
            {events.length === 0 ? (
              <li className="text-[var(--text-muted)]">
                {t("console.services.requests.detail.noEvents", undefined, "No events yet.")}
              </li>
            ) : (
              events.map((e) => {
                const p = e.payload as Record<string, unknown> | null;
                const note =
                  p && typeof (p as { note?: unknown }).note === "string" ? (p as { note: string }).note : null;
                const from = p && (p as { from?: unknown }).from;
                const to = p && (p as { to?: unknown }).to;
                const transition = from && to ? `${String(from)} → ${String(to)}` : null;
                return (
                  <li key={e.id} className="flex items-start gap-3">
                    <span className="font-mono text-[var(--text-muted)]">
                      {new Date(e.occurred_at).toLocaleTimeString()}
                    </span>
                    <span className="flex-1">
                      <Badge variant="muted">{toTitle(e.kind)}</Badge>
                      {(transition || note) && (
                        <span className="ms-2 text-[var(--text-secondary)]">
                          {[transition, note].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </span>
                  </li>
                );
              })
            )}
          </ol>
        </section>
      </div>
    </>
  );
}
