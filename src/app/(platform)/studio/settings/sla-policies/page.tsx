import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { deleteSlaPolicy, toggleSlaPolicy, upsertSlaPolicy } from "./actions";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  severity: "P1" | "P2" | "P3" | "P4";
  response_minutes: number;
  resolution_minutes: number;
  business_hours_only: boolean;
  active: boolean;
};

const SEVERITY_TONE: Record<string, "muted" | "info" | "warning" | "error"> = {
  P1: "error",
  P2: "warning",
  P3: "info",
  P4: "muted",
};

const SEVERITY_HINTS: Array<{ severity: "P1" | "P2" | "P3" | "P4"; response: number; resolution: number }> = [
  { severity: "P1", response: 15, resolution: 4 * 60 },
  { severity: "P2", response: 60, resolution: 8 * 60 },
  { severity: "P3", response: 4 * 60, resolution: 24 * 60 },
  { severity: "P4", response: 24 * 60, resolution: 72 * 60 },
];

function humanMinutes(min: number): string {
  if (min < 60) return `${min}m`;
  const h = min / 60;
  if (h < 24) return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;
  const d = h / 24;
  return Number.isInteger(d) ? `${d}d` : `${d.toFixed(1)}d`;
}

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.settings.slaPolicies.eyebrow", undefined, "Settings")}
          title={t("console.settings.slaPolicies.title", undefined, "Service SLA Policies")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.settings.slaPolicies.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("service_sla_policies")
    .select("id, severity, response_minutes, resolution_minutes, business_hours_only, active")
    .eq("org_id", session.orgId)
    .order("severity", { ascending: true });
  const policies = (rows ?? []) as Row[];
  const configured = new Set(policies.map((p) => p.severity));
  const missing = SEVERITY_HINTS.filter((h) => !configured.has(h.severity));

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.settings.slaPolicies.eyebrow", undefined, "Settings")}
        title={t("console.settings.slaPolicies.title", undefined, "Service SLA Policies")}
        subtitle={t(
          "console.settings.slaPolicies.subtitle",
          { count: policies.length },
          `${policies.length} of 4 severities configured · drive response + resolution clocks on service requests`,
        )}
        breadcrumbs={[
          { label: t("console.settings.slaPolicies.crumb.settings", undefined, "Settings"), href: "/studio/settings" },
          { label: t("console.settings.slaPolicies.crumb.slaPolicies", undefined, "SLA Policies") },
        ]}
      />
      <div className="page-content space-y-5">
        <DataTable<Row>
          rows={policies}
          emptyLabel={t("console.settings.slaPolicies.empty.label", undefined, "No SLA policies configured yet")}
          emptyDescription={t(
            "console.settings.slaPolicies.empty.description",
            undefined,
            "Service request timers stay un-tracked until each severity has a policy. Pre-seed all four below to start the clock.",
          )}
          columns={[
            {
              key: "severity",
              header: t("console.settings.slaPolicies.col.severity", undefined, "Severity"),
              render: (r) => <Badge variant={SEVERITY_TONE[r.severity] ?? "muted"}>{r.severity}</Badge>,
              accessor: (r) => r.severity,
              filterable: true,
            },
            {
              key: "response_minutes",
              header: t("console.settings.slaPolicies.col.response", undefined, "Response"),
              render: (r) => <span className="font-mono text-xs">{humanMinutes(r.response_minutes)}</span>,
              accessor: (r) => r.response_minutes,
              mono: true,
            },
            {
              key: "resolution_minutes",
              header: t("console.settings.slaPolicies.col.resolution", undefined, "Resolution"),
              render: (r) => <span className="font-mono text-xs">{humanMinutes(r.resolution_minutes)}</span>,
              accessor: (r) => r.resolution_minutes,
              mono: true,
            },
            {
              key: "business_hours_only",
              header: t("console.settings.slaPolicies.col.window", undefined, "Window"),
              render: (r) =>
                r.business_hours_only ? (
                  <Badge variant="muted">
                    {t("console.settings.slaPolicies.window.businessHours", undefined, "Business hours")}
                  </Badge>
                ) : (
                  <Badge variant="info">{t("console.settings.slaPolicies.window.allHours", undefined, "24/7")}</Badge>
                ),
            },
            {
              key: "active",
              header: t("console.settings.slaPolicies.col.status", undefined, "Status"),
              render: (r) => (
                <form action={toggleSlaPolicy}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="active" value={String(!r.active)} />
                  <Button type="submit" variant="ghost" size="sm">
                    {r.active ? (
                      <Badge variant="success">
                        {t("console.settings.slaPolicies.status.active", undefined, "Active")}
                      </Badge>
                    ) : (
                      <Badge variant="muted">
                        {t("console.settings.slaPolicies.status.paused", undefined, "Paused")}
                      </Badge>
                    )}
                  </Button>
                </form>
              ),
            },
            {
              key: "actions",
              header: "",
              render: (r) => (
                <DeleteForm
                  action={deleteSlaPolicy.bind(null, r.id)}
                  confirm={t(
                    "console.settings.slaPolicies.deleteConfirm",
                    { severity: r.severity },
                    `Delete ${r.severity} policy? Service requests at this severity stop tracking against an SLA until a new policy is created.`,
                  )}
                />
              ),
            },
          ]}
        />

        <section className="surface p-5">
          <h2 className="text-sm font-semibold">
            {t("console.settings.slaPolicies.upsert.heading", undefined, "Create / Update Policy")}
          </h2>
          <p className="mt-1 text-xs text-[var(--p-text-2)]">
            {t(
              "console.settings.slaPolicies.upsert.help",
              undefined,
              "One active policy per severity. Submitting an existing severity updates it in place.",
            )}
          </p>
          <form
            action={upsertSlaPolicy}
            className="surface-inset mt-3 grid grid-cols-1 gap-2 rounded-md p-3 sm:grid-cols-6"
          >
            <select name="severity" required defaultValue="P2" className="ps-input sm:col-span-1">
              <option value="P1">{t("console.settings.slaPolicies.sev.p1", undefined, "P1 — Critical")}</option>
              <option value="P2">{t("console.settings.slaPolicies.sev.p2", undefined, "P2 — High")}</option>
              <option value="P3">{t("console.settings.slaPolicies.sev.p3", undefined, "P3 — Standard")}</option>
              <option value="P4">{t("console.settings.slaPolicies.sev.p4", undefined, "P4 — Low")}</option>
            </select>
            <input
              name="response_minutes"
              type="number"
              required
              min="1"
              max="100000"
              placeholder={t("console.settings.slaPolicies.placeholder.response", undefined, "Response — Min")}
              className="ps-input sm:col-span-2"
            />
            <input
              name="resolution_minutes"
              type="number"
              required
              min="1"
              max="1000000"
              placeholder={t("console.settings.slaPolicies.placeholder.resolution", undefined, "Resolution — Min")}
              className="ps-input sm:col-span-2"
            />
            <label className="flex items-center gap-2 text-xs sm:col-span-1">
              <input type="checkbox" name="business_hours_only" value="true" />
              {t("console.settings.slaPolicies.busHours", undefined, "Bus. hours")}
            </label>
            <div className="flex justify-end sm:col-span-6">
              <Button type="submit" size="sm" variant="secondary">
                {t("console.settings.slaPolicies.savePolicy", undefined, "Save Policy")}
              </Button>
            </div>
          </form>
        </section>

        {missing.length > 0 && (
          <section className="surface p-5">
            <h2 className="text-sm font-semibold">
              {t("console.settings.slaPolicies.defaults.heading", undefined, "Suggested Defaults")}
            </h2>
            <p className="mt-1 text-xs text-[var(--p-text-2)]">
              {t(
                "console.settings.slaPolicies.defaults.help",
                undefined,
                "Pre-seed the missing severities with industry-typical thresholds. Edit individually after seeding to match your contracts.",
              )}
            </p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {missing.map((m) => (
                <li key={m.severity} className="surface-inset flex items-center justify-between gap-3 rounded-md p-3">
                  <div className="text-xs">
                    <div className="text-sm font-semibold">{m.severity}</div>
                    <span className="font-mono">
                      {t(
                        "console.settings.slaPolicies.defaults.thresholds",
                        { response: humanMinutes(m.response), resolution: humanMinutes(m.resolution) },
                        `respond ${humanMinutes(m.response)} · resolve ${humanMinutes(m.resolution)}`,
                      )}
                    </span>
                  </div>
                  <form action={upsertSlaPolicy}>
                    <input type="hidden" name="severity" value={m.severity} />
                    <input type="hidden" name="response_minutes" value={String(m.response)} />
                    <input type="hidden" name="resolution_minutes" value={String(m.resolution)} />
                    <Button type="submit" variant="secondary" size="sm">
                      {t("console.settings.slaPolicies.defaults.preseed", undefined, "Pre-seed")}
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
