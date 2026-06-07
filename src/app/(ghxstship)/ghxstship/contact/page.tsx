import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SOLUTIONS, paths } from "@/lib/ghxstship";
import { GhxstshipJsonLd, breadcrumbSchema } from "@/components/ghxstship/JsonLd";
import { getRequestT } from "@/lib/i18n/request";

type Translate = Awaited<ReturnType<typeof getRequestT>>["t"];

export const dynamic = "force-static";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return {
    title: t("ghxstship.contact.meta.title", undefined, "Contact GHXSTSHIP — Start a Project"),
    description: t(
      "ghxstship.contact.meta.description",
      undefined,
      "Brief GHXSTSHIP. A paragraph in plain English, an RFP, or a voice memo. We resolve every brief against the same services catalog and reply with scope, model, and producer assignment within one business day.",
    ),
    alternates: { canonical: "https://ghxstship.pro/ghxstship/contact" },
  };
}

function buildRoutes(t: Translate) {
  return [
    {
      label: t("ghxstship.contact.routes.studio.label", undefined, "Start a Project"),
      body: t(
        "ghxstship.contact.routes.studio.body",
        undefined,
        "New engagement, RFP, or scoping conversation. We reply with engagement model, producer assignment, and price band.",
      ),
      href: "mailto:studio@ghxstship.pro",
      line: "studio@ghxstship.pro",
    },
    {
      label: t("ghxstship.contact.routes.federation.label", undefined, "Federation & Mega-Event"),
      body: t(
        "ghxstship.contact.routes.federation.body",
        undefined,
        "Olympic, FIFA, F1, Super Bowl, World Cup, NCAA, OCOG-tier, federation accreditation, host-city liaison.",
      ),
      href: "mailto:federation@ghxstship.pro",
      line: "federation@ghxstship.pro",
    },
    {
      label: t("ghxstship.contact.routes.press.label", undefined, "Press & Partnerships"),
      body: t(
        "ghxstship.contact.routes.press.body",
        undefined,
        "Media, sponsorship inbound, brand collaborations, podcast asks, speaking engagements.",
      ),
      href: "mailto:press@ghxstship.pro",
      line: "press@ghxstship.pro",
    },
    {
      label: t("ghxstship.contact.routes.roster.label", undefined, "Roster & Crew"),
      body: t(
        "ghxstship.contact.routes.roster.body",
        undefined,
        "Producers, technicians, riggers, hospitality, fixers — apply with your portfolio and city. We onboard quarterly.",
      ),
      href: "mailto:roster@ghxstship.pro",
      line: "roster@ghxstship.pro",
    },
  ];
}

export default async function ContactPage() {
  const { t } = await getRequestT();
  const ROUTES = buildRoutes(t);
  return (
    <>
      <GhxstshipJsonLd
        data={breadcrumbSchema([
          { label: "GHXSTSHIP", href: "/ghxstship" },
          { label: "Contact", href: "/ghxstship/contact" },
        ])}
      />
      <div className="space-y-20 pb-24">
        <section className="mx-auto max-w-6xl px-6 pt-16">
          <div className="text-xs font-semibold tracking-[0.25em] uppercase" style={{ color: "var(--p-accent)" }}>
            {t("ghxstship.contact.hero.eyebrow", undefined, "Contact")}
          </div>
          <h1 className="mt-4 text-5xl uppercase sm:text-7xl" style={{ fontFamily: "var(--font-display)" }}>
            {t("ghxstship.contact.hero.heading", undefined, "Brief us.")}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-[var(--p-text-2)]">
            {t(
              "ghxstship.contact.hero.body",
              undefined,
              "Tell us the brief, the date band, the venue or geography, and your scope. We’ll come back inside one business day with the engagement model, the producer assignment, and a price band — or a request for the information we’d need to scope it cleanly.",
            )}
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-6">
          <div className="grid gap-5 sm:grid-cols-2">
            {ROUTES.map((r) => (
              <a key={r.href} href={r.href} className="surface hover-lift group flex h-full flex-col p-6">
                <div className="text-xl uppercase" style={{ fontFamily: "var(--font-display)" }}>
                  {r.label}
                </div>
                <p className="mt-3 text-sm text-[var(--p-text-2)]">{r.body}</p>
                <div
                  className="mt-4 inline-flex items-center gap-2 font-mono text-sm tracking-wide"
                  style={{ color: "var(--p-accent)" }}
                >
                  {r.line}
                  <ArrowRight className="cta-nudge h-3.5 w-3.5" />
                </div>
              </a>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6">
          <div className="surface-raised p-8">
            <h2 className="text-2xl uppercase sm:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
              {t("ghxstship.contact.checklist.heading", undefined, "What to put in the email.")}
            </h2>
            <ul className="mt-6 grid gap-3 text-sm text-[var(--p-text-2)] sm:grid-cols-2">
              <li className="flex items-start gap-3">
                <span
                  className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0"
                  style={{ background: "var(--p-accent-text)" }}
                />
                <span>
                  <strong className="text-[var(--p-text-1)]">
                    {t("ghxstship.contact.checklist.brief.label", undefined, "Brief.")}
                  </strong>{" "}
                  {t(
                    "ghxstship.contact.checklist.brief.body",
                    undefined,
                    "One paragraph is enough. We’ll ask the right follow-ups.",
                  )}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span
                  className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0"
                  style={{ background: "var(--p-accent-text)" }}
                />
                <span>
                  <strong className="text-[var(--p-text-1)]">
                    {t("ghxstship.contact.checklist.dates.label", undefined, "Dates or window.")}
                  </strong>{" "}
                  {t(
                    "ghxstship.contact.checklist.dates.body",
                    undefined,
                    "Hard date or rolling window — both are fine.",
                  )}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span
                  className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0"
                  style={{ background: "var(--p-accent-text)" }}
                />
                <span>
                  <strong className="text-[var(--p-text-1)]">
                    {t("ghxstship.contact.checklist.venue.label", undefined, "Venue or geography.")}
                  </strong>{" "}
                  {t(
                    "ghxstship.contact.checklist.venue.body",
                    undefined,
                    "Specific address if locked, market name if not.",
                  )}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span
                  className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0"
                  style={{ background: "var(--p-accent-text)" }}
                />
                <span>
                  <strong className="text-[var(--p-text-1)]">
                    {t("ghxstship.contact.checklist.audience.label", undefined, "Audience size.")}
                  </strong>{" "}
                  {t("ghxstship.contact.checklist.audience.body", undefined, "Total guest count or daily attendance.")}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span
                  className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0"
                  style={{ background: "var(--p-accent-text)" }}
                />
                <span>
                  <strong className="text-[var(--p-text-1)]">
                    {t("ghxstship.contact.checklist.budget.label", undefined, "Budget envelope.")}
                  </strong>{" "}
                  {t(
                    "ghxstship.contact.checklist.budget.body",
                    undefined,
                    "Even a band — it sharpens the engagement model fast.",
                  )}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span
                  className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0"
                  style={{ background: "var(--p-accent-text)" }}
                />
                <span>
                  <strong className="text-[var(--p-text-1)]">
                    {t("ghxstship.contact.checklist.constraints.label", undefined, "Constraints.")}
                  </strong>{" "}
                  {t(
                    "ghxstship.contact.checklist.constraints.body",
                    undefined,
                    "Federation, union, host-city, clean zone, brand-rights, NDA — flag them up front.",
                  )}
                </span>
              </li>
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6">
          <div className="text-xs font-semibold tracking-[0.2em] text-[var(--p-text-2)] uppercase">
            {t("ghxstship.contact.browse.eyebrow", undefined, "Or start by browsing")}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SOLUTIONS.slice(0, 9).map((s) => (
              <Link key={s.slug} href={paths.solutionDetail(s.slug)} className="surface hover-lift block p-4 text-sm">
                {s.name}
              </Link>
            ))}
          </div>
          <div className="mt-6">
            <Link
              href={paths.solutionsRoot()}
              className="text-sm font-semibold tracking-wide uppercase hover:text-[var(--p-accent)]"
            >
              {t("ghxstship.common.all19Industries", undefined, "All 19 industries →")}
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
