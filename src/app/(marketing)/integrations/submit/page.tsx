import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FormShell } from "@/components/FormShell";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { toTitle } from "@/lib/format";
import { submitPartnerIntegration } from "./actions";
import { getRequestT } from "@/lib/i18n/request";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t(
      "marketing.integrations.submit.meta.title",
      undefined,
      "Submit a Partner Integration: ATLVS Partner Program",
    ),
    description: t(
      "marketing.integrations.submit.meta.description",
      undefined,
      "Build an integration against the ATLVS REST + GraphQL API and we'll list it in our partner directory. Verified Partner reviews pass our tech checklist; Certified passes end-to-end QA on a live tenant.",
    ),
    path: "/integrations/submit",
    ogImageEyebrow: t("marketing.integrations.eyebrow", undefined, "Partner Program"),
    ogImageTitle: t("marketing.integrations.submit.title", undefined, "Build It. Ship It. We'll List It."),
  });
}

const INPUT = "w-full rounded-md border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--p-text-2)]";

const CATEGORIES = [
  "payments",
  "ai",
  "infra",
  "comms",
  "auth",
  "observability",
  "geo",
  "calendar",
  "accounting",
  "field",
  "design",
  "other",
] as const;

export default async function Page() {
  const { t } = await getRequestT();
  const crumbs = [
    { label: t("common.home", undefined, "Home"), href: "/" },
    { label: t("marketing.integrations.crumbsLabel", undefined, "Integrations"), href: "/integrations" },
    {
      label: t("marketing.integrations.submit.crumbsLabel", undefined, "Submit Partner Integration"),
      href: "/integrations/submit",
    },
  ];

  return (
    <div>
      <JsonLd data={[breadcrumbSchema(crumbs)]} />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-2xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">{t("marketing.integrations.eyebrow", undefined, "Partner Program")}</div>
        <h1 className="hed-2xl mt-4">
          {t("marketing.integrations.submit.h1", undefined, "Submit A Partner Integration")}
        </h1>
        <p className="mt-3 text-sm text-[var(--p-text-2)]">
          {t(
            "marketing.integrations.submit.lead",
            undefined,
            "Once submitted, your proposal lands in the ATLVS partner-AM queue. We typically respond within 5 business days. Verified Partner review passes our technical checklist; Certified additionally passes end-to-end QA on a live tenant.",
          )}
        </p>

        <div className="surface mt-8 p-6">
          <FormShell
            action={submitPartnerIntegration}
            cancelHref="/integrations"
            submitLabel={t("marketing.integrations.submit.submitLabel", undefined, "Submit Proposal")}
          >
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>
                  {t("marketing.integrations.submit.fields.name", undefined, "Integration Name")}
                  <span className="ms-0.5 text-[var(--p-danger)]">*</span>
                </span>
                <input name="name" required maxLength={120} placeholder="Acme Field Reports" className={INPUT} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>
                  {t("marketing.integrations.submit.fields.slug", undefined, "Slug")}
                  <span className="ms-0.5 text-[var(--p-danger)]">*</span>
                </span>
                <input
                  name="slug"
                  required
                  pattern="[a-z0-9-]+"
                  maxLength={48}
                  placeholder="acme-field-reports"
                  className={`${INPUT} font-mono`}
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>
                  {t("marketing.integrations.submit.fields.partnerOrg", undefined, "Partner Org")}
                  <span className="ms-0.5 text-[var(--p-danger)]">*</span>
                </span>
                <input name="partner_org_name" required maxLength={120} placeholder="Acme Inc" className={INPUT} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>
                  {t("marketing.integrations.submit.fields.category", undefined, "Category")}
                  <span className="ms-0.5 text-[var(--p-danger)]">*</span>
                </span>
                <select name="category" required defaultValue="field" className={INPUT}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {toTitle(c)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>
                  {t("marketing.integrations.submit.fields.contactEmail", undefined, "Contact Email")}
                  <span className="ms-0.5 text-[var(--p-danger)]">*</span>
                </span>
                <input
                  type="email"
                  name="partner_contact_email"
                  required
                  maxLength={200}
                  placeholder="partner@acme.com"
                  className={INPUT}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>
                  {t("marketing.integrations.submit.fields.contactName", undefined, "Contact Name")}
                </span>
                <input name="partner_contact_name" maxLength={120} placeholder="Jane Doe" className={INPUT} />
              </label>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t(
                  "marketing.integrations.submit.fields.shortDescription",
                  undefined,
                  "Short Description (one sentence)",
                )}
                <span className="ms-0.5 text-[var(--p-danger)]">*</span>
              </span>
              <input
                name="short_description"
                required
                maxLength={200}
                placeholder={t(
                  "marketing.integrations.submit.placeholders.shortDescription",
                  undefined,
                  "Field-report capture with auto-sync to ATLVS daily logs.",
                )}
                className={INPUT}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("marketing.integrations.submit.fields.longDescription", undefined, "Long Description")}
              </span>
              <textarea
                name="long_description"
                rows={4}
                maxLength={2000}
                placeholder={t(
                  "marketing.integrations.submit.placeholders.longDescription",
                  undefined,
                  "What it does, who it’s for, how it integrates with ATLVS.",
                )}
                className={INPUT}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("marketing.integrations.submit.fields.capabilities", undefined, "Capabilities, One per Line")}
              </span>
              <textarea
                name="capabilities"
                rows={4}
                maxLength={2000}
                placeholder={"Daily log capture\nPhoto upload with location\nCSI-coded note tagging"}
                className={INPUT}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>
                  {t("marketing.integrations.submit.fields.homepageUrl", undefined, "Homepage URL")}
                </span>
                <input
                  type="url"
                  name="homepage_url"
                  maxLength={400}
                  placeholder="https://acme.com"
                  className={`${INPUT} font-mono`}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>
                  {t("marketing.integrations.submit.fields.docsUrl", undefined, "Integration Docs URL")}
                </span>
                <input
                  type="url"
                  name="docs_url"
                  maxLength={400}
                  placeholder="https://acme.com/atlvs"
                  className={`${INPUT} font-mono`}
                />
              </label>
            </div>
          </FormShell>
        </div>
      </section>
    </div>
  );
}
