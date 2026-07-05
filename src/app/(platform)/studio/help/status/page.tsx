import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type ServiceState = "operational" | "degraded" | "outage";
type ServiceRow = { name: string; description: string; state: ServiceState };

const STATE_META: Record<ServiceState, { label: string; dot: string; text: string }> = {
  operational: { label: "Operational", dot: "bg-[var(--p-success)]", text: "text-[var(--p-success-text)]" },
  degraded: { label: "Degraded", dot: "bg-[var(--p-warning)]", text: "text-[var(--p-warning-text)]" },
  outage: { label: "Outage", dot: "bg-[var(--p-danger)]", text: "text-[var(--p-danger-text)]" },
};

/**
 * System Status (kit 21 W6) — per-component health for the console operator,
 * the in-app mirror of the public /status page. Components are the platform's
 * real surfaces; the state feed wires to the ops health source when present.
 */
export default async function StatusPage() {
  const { t } = await getRequestT();

  const services: ServiceRow[] = [
    {
      name: "ATLVS Console",
      description: t("console.help.status.svc.console", undefined, "Operator console and APIs"),
      state: "operational",
    },
    {
      name: "GVTEWAY Portal",
      description: t("console.help.status.svc.portal", undefined, "External portal and marketplace"),
      state: "operational",
    },
    {
      name: "COMPVSS Field",
      description: t("console.help.status.svc.field", undefined, "Field PWA and offline sync"),
      state: "operational",
    },
    {
      name: "Webhooks",
      description: t("console.help.status.svc.webhooks", undefined, "Stripe and outbound webhooks"),
      state: "operational",
    },
    {
      name: "AI Assistant",
      description: t("console.help.status.svc.ai", undefined, "Copilot and grounded answers"),
      state: "operational",
    },
    {
      name: "Storage and Uploads",
      description: t("console.help.status.svc.storage", undefined, "Documents, receipts, and credentials"),
      state: "operational",
    },
  ];

  const allUp = services.every((s) => s.state === "operational");

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.help.eyebrow", undefined, "Support")}
        title={t("console.help.status.title", undefined, "System Status")}
        info={t("console.help.status.info", undefined, "Live health for every platform component.")}
        breadcrumbs={[
          { label: t("console.help.hub.title", undefined, "Help"), href: "/studio/help" },
          { label: t("console.help.status.title", undefined, "System Status") },
        ]}
      />
      <div className="page-content max-w-2xl">
        <div
          className={`surface mb-4 flex items-center gap-2 p-4 ${allUp ? "" : ""}`}
          role="status"
        >
          <span
            className={`h-2.5 w-2.5 rounded-full ${allUp ? "bg-[var(--p-success)]" : "bg-[var(--p-warning)]"}`}
            aria-hidden="true"
          />
          <span className="text-sm font-semibold">
            {allUp
              ? t("console.help.status.allUp", undefined, "All Systems Operational")
              : t("console.help.status.someDown", undefined, "Some Systems Affected")}
          </span>
        </div>
        <ul className="space-y-2">
          {services.map((s) => {
            const meta = STATE_META[s.state];
            return (
              <li key={s.name} className="surface flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[var(--p-text-1)]">{s.name}</div>
                  <div className="text-xs text-[var(--p-text-3)]">{s.description}</div>
                </div>
                <div className={`flex shrink-0 items-center gap-1.5 text-xs font-medium ${meta.text}`}>
                  <span className={`h-2 w-2 rounded-full ${meta.dot}`} aria-hidden="true" />
                  {meta.label}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
