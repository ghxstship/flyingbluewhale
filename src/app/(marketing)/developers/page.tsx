import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { FAQSection } from "@/components/marketing/FAQ";
import { MarketingHero, MarketingSection, MarketingGrid, MarketingPageShell } from "@/components/marketing/MarketingPrimitives";
import { buildMetadata, breadcrumbSchema, faqSchema } from "@/lib/seo";
import { getStaticEnT } from "../_lib/static-t";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getStaticEnT();
  return buildMetadata({
    title: t("marketing.pages.developers.metadata.title", undefined, "Developers: Build On The Record Store"),
    description: t(
      "marketing.pages.developers.metadata.description",
      undefined,
      "An OpenAPI-described REST API with scoped personal access tokens: documents, reports, and advancing. Submit an integration, join the partner program, or read the spec.",
    ),
    path: "/developers",
    keywords: [
      "ATLVS API",
      "production management API",
      "event production REST API",
      "OpenAPI event platform",
      "ATLVS integrations",
    ],
    ogImageEyebrow: t("marketing.pages.developers.metadata.ogImageEyebrow", undefined, "Developers"),
    ogImageTitle: t("marketing.pages.developers.metadata.ogImageTitle", undefined, "Build On The Record Store"),
  });
}

export default async function DevelopersPage() {
  const { t } = await getStaticEnT();

  const API_DOMAINS = [
    {
      key: "documents",
      name: t("marketing.pages.developers.domains.documents.name", undefined, "Documents"),
      body: t(
        "marketing.pages.developers.domains.documents.body",
        undefined,
        "29 document types with a machine-readable contract each: JSON Schema, sample data, and merge-field paths. Post your data or a record id and get rendered HTML back.",
      ),
      endpoint: "GET /api/v1/documents",
    },
    {
      key: "reports",
      name: t("marketing.pages.developers.domains.reports.name", undefined, "Reports and metrics"),
      body: t(
        "marketing.pages.developers.domains.reports.body",
        undefined,
        "A catalog of 77 KPI definitions and 43 reports, computed live from the caller's org data. Metrics without backing data return null.",
      ),
      endpoint: "GET /api/v1/metrics",
    },
    {
      key: "advancing",
      name: t("marketing.pages.developers.domains.advancing.name", undefined, "Advancing"),
      body: t(
        "marketing.pages.developers.domains.advancing.body",
        undefined,
        "Read a project's advance packet graph or create the packet shell, and track a merge send's per-recipient delivery funnel. Portal tokens never leave the platform.",
      ),
      endpoint: "GET /api/v1/projects/{id}/advance-packets",
    },
  ];

  const SCOPES: Array<{ scope: string; grants: string }> = [
    {
      scope: "documents:read",
      grants: t(
        "marketing.pages.developers.scopes.documentsRead",
        undefined,
        "List document types and read each type's JSON Schema, sample, and merge-field paths.",
      ),
    },
    {
      scope: "documents:write",
      grants: t(
        "marketing.pages.developers.scopes.documentsWrite",
        undefined,
        "Generate documents from your own data or from a record you can access.",
      ),
    },
    {
      scope: "reports:read",
      grants: t(
        "marketing.pages.developers.scopes.reportsRead",
        undefined,
        "Read the metric catalog, resolve metric values, and pull reports and snapshots.",
      ),
    },
    {
      scope: "advancing:read",
      grants: t(
        "marketing.pages.developers.scopes.advancingRead",
        undefined,
        "Read advance packets, sections, audiences, and send-batch tracking boards.",
      ),
    },
    {
      scope: "advancing:write",
      grants: t(
        "marketing.pages.developers.scopes.advancingWrite",
        undefined,
        "Create a project's advance packet shell (manager role or above).",
      ),
    },
  ];

  const FAQS = [
    {
      q: t("marketing.pages.developers.faq.live.q", undefined, "Is the API live today?"),
      a: t(
        "marketing.pages.developers.faq.live.a",
        undefined,
        "Yes. The documents, reports, and advancing endpoints are in production and described in the OpenAPI spec at /api/v1/openapi.json. If it's in the spec, it's real; we don't document endpoints that don't exist.",
      ),
    },
    {
      q: t("marketing.pages.developers.faq.token.q", undefined, "How do I get a token?"),
      a: t(
        "marketing.pages.developers.faq.token.a",
        undefined,
        "Sign up, then mint a personal access token in your API settings. Tokens carry only the scopes you grant them, and a typo'd scope is rejected at mint time instead of failing silently later.",
      ),
    },
    {
      q: t("marketing.pages.developers.faq.sdk.q", undefined, "Is there an SDK?"),
      a: t(
        "marketing.pages.developers.faq.sdk.a",
        undefined,
        "Not yet. The API is plain REST over HTTPS with an OpenAPI 3 spec, so generated clients work today. When we ship an official SDK we'll say so here first.",
      ),
    },
  ];

  const crumbs = [
    { label: t("marketing.pages.developers.breadcrumbs.home", undefined, "Home"), href: "/" },
    { label: t("marketing.pages.developers.breadcrumbs.developers", undefined, "Developers"), href: "/developers" },
  ];

  return (
    <MarketingPageShell>
      <JsonLd data={[breadcrumbSchema(crumbs), faqSchema(FAQS)]} />

      <MarketingHero
        eyebrow={t("marketing.pages.developers.hero.eyebrow", undefined, "Developers and partners")}
        title={t("marketing.pages.developers.hero.title", undefined, "Build On The Record Store")}
        subtitle={t(
          "marketing.pages.developers.hero.subtitle",
          undefined,
          "Every production on the platform lives on one set of records: projects, documents, money, people. The API reads and writes those same records, scoped to exactly what you grant it.",
        )}
        actions={
          <>
            <a href="/api/v1/openapi.json" className="ps-btn">
              {t("marketing.pages.developers.hero.ctaSpec", undefined, "Read the OpenAPI spec")}
            </a>
            <Link href="/integrations/submit" className="ps-btn ps-btn--ghost">
              {t("marketing.pages.developers.hero.ctaSubmit", undefined, "Submit an integration")}
            </Link>
          </>
        }
      />

      <MarketingSection
        eyebrow={t("marketing.pages.developers.apiSection.eyebrow", undefined, "The API")}
        title={t("marketing.pages.developers.apiSection.title", undefined, "What's Open To Third Parties Today")}
        subtitle={t(
          "marketing.pages.developers.apiSection.subtitle",
          undefined,
          "Three domains are open to third parties now. Everything below ships in the spec and runs in production.",
        )}
      >
        <MarketingGrid cols={3}>
          {API_DOMAINS.map((d) => (
            <div key={d.key} className="surface p-6">
              <h3 className="font-semibold">{d.name}</h3>
              <p className="mt-2 text-sm text-[var(--p-text-2)]">{d.body}</p>
              <code className="ps-id mt-3 inline-block text-xs text-[var(--p-text-3)]">{d.endpoint}</code>
            </div>
          ))}
        </MarketingGrid>
      </MarketingSection>

      <MarketingSection
        eyebrow={t("marketing.pages.developers.scopesSection.eyebrow", undefined, "Access")}
        title={t("marketing.pages.developers.scopesSection.title", undefined, "Tokens Carry Only What You Grant")}
        subtitle={t(
          "marketing.pages.developers.scopesSection.subtitle",
          undefined,
          "Personal access tokens carry named scopes. A reporting integration gets reports:read and nothing else. These are the scopes open to third parties today.",
        )}
      >
        <div className="surface overflow-x-auto p-2">
          <table className="data-table w-full text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left">
                  {t("marketing.pages.developers.scopesTable.scope", undefined, "Scope")}
                </th>
                <th className="px-4 py-3 text-left">
                  {t("marketing.pages.developers.scopesTable.grants", undefined, "What it grants")}
                </th>
              </tr>
            </thead>
            <tbody>
              {SCOPES.map((s) => (
                <tr key={s.scope}>
                  <td className="px-4 py-3 align-top">
                    <code className="ps-id text-xs">{s.scope}</code>
                  </td>
                  <td className="px-4 py-3 text-[var(--p-text-2)]">{s.grants}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 max-w-2xl text-sm text-[var(--p-text-3)]">
          {t(
            "marketing.pages.developers.scopesSection.footnote",
            undefined,
            "Stripe is wired into the platform natively: checkout, Connect onboarding, and signature-verified webhook receipt. You don't build payment plumbing to integrate with us.",
          )}
        </p>
      </MarketingSection>

      <MarketingSection
        eyebrow={t("marketing.pages.developers.buildSection.eyebrow", undefined, "Ship with us")}
        title={t("marketing.pages.developers.buildSection.title", undefined, "Two Ways In")}
      >
        <MarketingGrid cols={2}>
          <div className="surface p-6">
            <h3 className="font-semibold">
              {t("marketing.pages.developers.buildSection.integration.title", undefined, "List an integration")}
            </h3>
            <p className="mt-2 text-sm text-[var(--p-text-2)]">
              {t(
                "marketing.pages.developers.buildSection.integration.body",
                undefined,
                "Built something on the API? Submit it for review and we'll list it in the integrations directory where operators go looking.",
              )}
            </p>
            <div className="mt-4">
              <Link href="/integrations/submit" className="ps-btn">
                {t("marketing.pages.developers.buildSection.integration.cta", undefined, "Submit an integration")}
              </Link>
            </div>
          </div>
          <div className="surface p-6">
            <h3 className="font-semibold">
              {t("marketing.pages.developers.buildSection.partner.title", undefined, "Join the partner program")}
            </h3>
            <p className="mt-2 text-sm text-[var(--p-text-2)]">
              {t(
                "marketing.pages.developers.buildSection.partner.body",
                undefined,
                "Agencies and implementation shops get a public profile in the live agency directory and a direct line to the team.",
              )}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/partners" className="ps-btn">
                {t("marketing.pages.developers.buildSection.partner.cta", undefined, "Partner program")}
              </Link>
              <Link href="/marketplace/agencies" className="ps-btn ps-btn--ghost">
                {t("marketing.pages.developers.buildSection.partner.ctaDirectory", undefined, "Agency directory")}
              </Link>
            </div>
          </div>
        </MarketingGrid>
      </MarketingSection>

      <MarketingSection
        eyebrow={t("marketing.pages.developers.docsSection.eyebrow", undefined, "Reading")}
        title={t("marketing.pages.developers.docsSection.title", undefined, "The Paper Trail")}
      >
        <ul className="max-w-2xl space-y-3">
          <li className="surface flex flex-wrap items-center justify-between gap-3 p-4">
            <span className="text-sm">
              {t("marketing.pages.developers.docsSection.spec", undefined, "OpenAPI 3 spec, generated from the live routes")}
            </span>
            <a href="/api/v1/openapi.json" className="text-sm font-medium text-[var(--p-accent-text)]">
              /api/v1/openapi.json
            </a>
          </li>
          <li className="surface flex flex-wrap items-center justify-between gap-3 p-4">
            <span className="text-sm">
              {t("marketing.pages.developers.docsSection.docs", undefined, "Product and platform documentation")}
            </span>
            <Link href="/docs" className="text-sm font-medium text-[var(--p-accent-text)]">
              /docs
            </Link>
          </li>
          <li className="surface flex flex-wrap items-center justify-between gap-3 p-4">
            <span className="text-sm">
              {t("marketing.pages.developers.docsSection.tokens", undefined, "Mint a personal access token in API settings")}
            </span>
            <Link href="/signup?next=/settings/api" className="text-sm font-medium text-[var(--p-accent-text)]">
              {t("marketing.pages.developers.docsSection.tokensCta", undefined, "Get a token")}
            </Link>
          </li>
        </ul>
      </MarketingSection>

      <FAQSection faqs={FAQS} />

      <CTASection
        title={t("marketing.pages.developers.cta.title", undefined, "The Spec Is The Pitch.")}
        subtitle={t(
          "marketing.pages.developers.cta.subtitle",
          undefined,
          "Read it, mint a token, and make your first call this afternoon. When it works, list it.",
        )}
      />
    </MarketingPageShell>
  );
}
