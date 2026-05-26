import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { Button } from "@/components/ui/Button";
import { buildMetadata, breadcrumbSchema, SITE } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Status — Platform Uptime + Incident History",
  description:
    "Real-time platform status across ATLVS, GVTEWAY, COMPVSS, and the marketing surface. Subscribe to incident alerts.",
  path: "/status",
  keywords: ["ATLVS status", "ATLVS uptime", "ATLVS Technologies incidents", "platform health"],
  ogImageEyebrow: "Status",
  ogImageTitle: "Platform Health.",
});

type ServiceRow = { name: string; description: string; state: "operational" | "degraded" | "outage" };

const SERVICES: ServiceRow[] = [
  { name: "ATLVS", description: "Production operations workspace (app.atlvs.pro)", state: "operational" },
  { name: "GVTEWAY Portal", description: "Stakeholder portals (gvteway.atlvs.pro)", state: "operational" },
  { name: "COMPVSS Field", description: "Offline-first PWA (compvss.atlvs.pro)", state: "operational" },
  { name: "Marketing + Auth", description: "atlvs.pro + auth flows", state: "operational" },
  { name: "Webhooks", description: "Outbound + inbound webhook delivery", state: "operational" },
  { name: "AI Assistant", description: "Anthropic Claude integration", state: "operational" },
  { name: "Stripe Connect", description: "Vendor payout rail", state: "operational" },
];

const STATE_COLOR: Record<ServiceRow["state"], string> = {
  operational: "var(--color-success)",
  degraded: "var(--color-warning)",
  outage: "var(--color-error)",
};

const STATE_LABEL: Record<ServiceRow["state"], string> = {
  operational: "Operational",
  degraded: "Degraded",
  outage: "Major Outage",
};

export default function StatusPage() {
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Status", href: "/status" },
  ];

  return (
    <div>
      <JsonLd data={[breadcrumbSchema(crumbs)]} />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">Status</div>
        <h1 className="hed-3xl mt-4">All Systems Operational.</h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--text-secondary)]">
          Real-time platform health across ATLVS, GVTEWAY, COMPVSS, and the marketing surface. Subscribe for incident
          alerts via email or webhook.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--surface-inset)] px-3 py-1.5">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: "var(--success)" }}
            aria-hidden="true"
          />
          <span className="text-xs font-medium">All systems operational · last 30 days</span>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface overflow-hidden">
          {SERVICES.map((s, i) => (
            <div
              key={s.name}
              className={`flex items-center justify-between p-5 ${i < SERVICES.length - 1 ? "border-b border-[var(--border-color)]" : ""}`}
            >
              <div>
                <div className="text-sm font-semibold">{s.name}</div>
                <div className="mt-1 text-xs text-[var(--text-muted)]">{s.description}</div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: STATE_COLOR[s.state] }}
                  aria-hidden="true"
                />
                <span className="text-xs font-medium" style={{ color: STATE_COLOR[s.state] }}>
                  {STATE_LABEL[s.state]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface p-8 md:p-10">
          <div className="eyebrow eyebrow-brand">Coming Soon</div>
          <h2 className="hed-lg mt-3">Live Status Page.</h2>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            The page above shows current state. Soon: 90-day uptime per service, incident history with post-mortems,
            subscribe-by-email and webhook for alerts. Targeting Q4 launch on
            <span className="font-mono"> status.{SITE.domain}</span>.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/contact" variant="secondary">
              Get notified at launch
            </Button>
          </div>
        </div>
      </section>

      <CTASection title="ATLVS Is Open." subtitle="Free for small teams. Per-org pricing the rest of the way up." />
    </div>
  );
}
