import type { Metadata } from "next";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { Button } from "@/components/ui/Button";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { getRequestT } from "@/lib/i18n/request";
import { env, hasSupabase } from "@/lib/env";

// E-09: the page renders live probe results — never cache an "operational"
// claim.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.pages.status.meta.title"),
    description: t("marketing.pages.status.meta.description"),
    path: "/status",
    keywords: ["ATLVS status", "ATLVS uptime", "ATLVS Technologies incidents", "platform health"],
    ogImageEyebrow: t("marketing.pages.status.meta.ogEyebrow"),
    ogImageTitle: t("marketing.pages.status.meta.ogTitle"),
  });
}

type ProbeState = "operational" | "degraded" | "outage" | "unknown";

type ProbeRow = {
  name: string;
  description: string;
  state: ProbeState;
  detail: string | null;
};

const STATE_COLOR: Record<ProbeState, string> = {
  operational: "var(--p-success)",
  degraded: "var(--p-warning)",
  outage: "var(--p-danger)",
  unknown: "var(--p-text-3)",
};

/**
 * E-09: a real reachability probe against the backing Supabase project's
 * health endpoint. 3.5s budget; a timeout reads as an outage from where this
 * page runs, a slow-but-alive response as degraded, and a missing
 * configuration as honestly unknown.
 */
async function probeSupabase(): Promise<{ state: ProbeState; detail: string | null }> {
  if (!hasSupabase) return { state: "unknown", detail: null };
  const started = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`, {
      cache: "no-store",
      signal: controller.signal,
      headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
    });
    clearTimeout(timer);
    const ms = Date.now() - started;
    if (!res.ok) return { state: "degraded", detail: `HTTP ${res.status}` };
    return ms > 2000 ? { state: "degraded", detail: `${ms}ms` } : { state: "operational", detail: `${ms}ms` };
  } catch {
    return { state: "outage", detail: "unreachable" };
  }
}

export default async function StatusPage() {
  const { t } = await getRequestT();
  const crumbs = [
    { label: t("marketing.pages.status.breadcrumbs.home"), href: "/" },
    { label: t("marketing.pages.status.breadcrumbs.status"), href: "/status" },
  ];

  const db = await probeSupabase();

  const STATE_LABEL: Record<ProbeState, string> = {
    operational: t("marketing.pages.status.stateLabel.operational"),
    degraded: t("marketing.pages.status.stateLabel.degraded"),
    outage: t("marketing.pages.status.stateLabel.outage"),
    unknown: t("marketing.pages.status.stateLabel.unknown", undefined, "Not yet monitored"),
  };

  // Only claim what this request can actually observe: the web tier proved
  // itself by rendering this page; the database/API tier is probed live; the
  // rest is honestly labeled as not yet monitored — no fabricated green dots.
  const ROWS: ProbeRow[] = [
    {
      name: t("marketing.pages.status.probes.web.name", undefined, "Web application"),
      description: t(
        "marketing.pages.status.probes.web.description",
        undefined,
        "Marketing, auth, console, portal, and field shells. Serving this page counts as the check.",
      ),
      state: "operational",
      detail: null,
    },
    {
      name: t("marketing.pages.status.probes.db.name", undefined, "Database & platform API"),
      description: t(
        "marketing.pages.status.probes.db.description",
        undefined,
        "The backing data platform, probed live from this request.",
      ),
      state: db.state,
      detail: db.detail,
    },
    {
      name: t("marketing.pages.status.probes.integrations.name", undefined, "Payments, webhooks & AI"),
      description: t(
        "marketing.pages.status.probes.integrations.description",
        undefined,
        "Third-party dependencies. Per-component monitoring is not wired yet, so no claim is made here.",
      ),
      state: "unknown",
      detail: null,
    },
  ];

  const anyOutage = ROWS.some((r) => r.state === "outage");
  const anyDegraded = ROWS.some((r) => r.state === "degraded");
  const overallState: ProbeState = anyOutage ? "outage" : anyDegraded ? "degraded" : "operational";
  const overallLabel = anyOutage
    ? t("marketing.pages.status.hero.badgeOutage", undefined, "Service disruption detected")
    : anyDegraded
      ? t("marketing.pages.status.hero.badgeDegraded", undefined, "Degraded performance detected")
      : t("marketing.pages.status.hero.badgeChecked", undefined, "Monitored components responding normally");

  return (
    <div>
      <JsonLd data={[breadcrumbSchema(crumbs)]} />
      <section className="mx-auto max-w-6xl px-6 pt-12 pb-12">
        <div className="eyebrow eyebrow-brand">{t("marketing.pages.status.hero.eyebrow")}</div>
        <h1 className="hed-3xl mt-4">{t("marketing.pages.status.hero.title")}</h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--p-text-2)]">{t("marketing.pages.status.hero.body")}</p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--p-border)] bg-[var(--p-surface-2)] px-3 py-1.5">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: STATE_COLOR[overallState] }}
            aria-hidden="true"
          />
          <span className="text-xs font-medium">{overallLabel}</span>
        </div>
        <p className="mt-3 text-xs text-[var(--p-text-3)]">
          {t(
            "marketing.pages.status.hero.checkedNote",
            undefined,
            "Checked live when this page loaded. Refresh for a fresh probe.",
          )}
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface overflow-hidden">
          {ROWS.map((s, i) => (
            <div
              key={s.name}
              className={`flex items-center justify-between gap-4 p-5 ${i < ROWS.length - 1 ? "border-b border-[var(--p-border)]" : ""}`}
            >
              <div>
                <div className="text-sm font-semibold">{s.name}</div>
                <div className="mt-1 text-xs text-[var(--p-text-2)]">{s.description}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {s.detail && <span className="font-mono text-[11px] text-[var(--p-text-3)]">{s.detail}</span>}
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
          <div className="eyebrow eyebrow-brand">
            {t("marketing.pages.status.incidents.eyebrow", undefined, "Incident History")}
          </div>
          <h2 className="hed-lg mt-3">
            {t("marketing.pages.status.incidents.title", undefined, "No published incidents yet")}
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-[var(--p-text-2)]">
            {t(
              "marketing.pages.status.incidents.body",
              undefined,
              "We have not yet published a formal incident log. This section will carry dated incident reports and postmortems once the first one exists. If something looks wrong right now, tell us and a human will look.",
            )}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/contact" variant="secondary">
              {t("marketing.pages.status.comingSoon.cta")}
            </Button>
          </div>
        </div>
      </section>

      <CTASection title={t("marketing.pages.status.cta.title")} subtitle={t("marketing.pages.status.cta.subtitle")} />
    </div>
  );
}
