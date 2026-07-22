// ISR — regenerate static HTML every 5 min. Uses the static English
// translator (no session, no cookies) so the page stays static-compatible.
export const revalidate = 300;

import type { Metadata } from "next";
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  ClipboardList,
  Clock,
  PackageCheck,
  QrCode,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { StatStrip } from "@/components/marketing/StatStrip";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, softwareApplicationSchema, CANONICAL_CTAS, SITE } from "@/lib/seo";
import { urlFor } from "@/lib/urls";
import { getStaticEnT } from "../_lib/static-t";
import { Wordmark } from "@/components/brand/Wordmark";

// COMPVSS accent (signal yellow) comes from the theme: the wrapper sets
// `data-theme="atlvs-product" data-platform="compvss"`, so `--p-accent*`
// resolve to the COMPVSS ramp for this subtree — no inline hexes.
const K = "marketing.pages.compvssHome";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getStaticEnT();
  return buildMetadata({
    title: t(`${K}.meta.title`, undefined, "COMPVSS: Site & Venue Operations for Deskless Crews"),
    description: t(
      `${K}.meta.description`,
      undefined,
      "Shifts, gate scan, incidents, punch lists, asset custody. Offline-first PWA that installs from the browser in one tap. Per-org pricing, never per seat.",
    ),
    path: "/compvss",
    keywords: [
      "COMPVSS",
      "deskless workforce app",
      "crew scheduling app",
      "event gate scanning",
      "offline ticket scanning",
      "time clock with geofence",
      "incident reporting app",
      "punch list app",
      "site operations software",
    ],
    ogImageEyebrow: "COMPVSS",
    ogImageTitle: t(`${K}.meta.ogImageTitle`, undefined, "The Field Runs on It."),
  });
}

export default async function CompvssHomePage() {
  const { t } = await getStaticEnT();

  const crumbs = [
    { label: t(`${K}.crumbs.home`, undefined, "Home"), href: "/" },
    { label: "COMPVSS", href: "/compvss" },
  ];

  return (
    <div data-theme="atlvs-product" data-platform="compvss">
      <JsonLd
        data={[
          softwareApplicationSchema({
            name: "COMPVSS",
            appName: "COMPVSS",
            description: SITE.apps.compvss.tagline,
            url: urlFor("marketing", "/compvss"),
          }),
        ]}
      />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      {/* Hero — pain to outcome */}
      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-accent">
          <Wordmark word="COMPVSS" style={{ color: "var(--p-accent-text)" }} />
        </div>
        <h1 className="hed-3xl mt-3 max-w-4xl">
          {t(`${K}.hero.title`, undefined, "The gate does not wait for the spreadsheet.")}
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--p-text-2)]">
          {t(
            `${K}.hero.body`,
            undefined,
            "Call times on paper, scans on a rented gun, incident reports written from memory two days later. COMPVSS puts the shift clock, the gate scanner, incident filing, and the punch list on the crew's own phones, and it keeps working when the signal quits.",
          )}
        </p>
        {/* Entity line — the canonical COMPVSS one-liner, verbatim. */}
        <p className="mt-4 max-w-2xl text-sm text-[var(--p-text-2)]">{SITE.apps.compvss.tagline}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href={CANONICAL_CTAS.primary.href}>{CANONICAL_CTAS.primary.label}</Button>
          <Button href="/pricing" variant="secondary">
            {t(`${K}.hero.secondaryCta`, undefined, "See pricing")}
          </Button>
        </div>
      </section>

      <StatStrip
        stats={[
          {
            value: t(`${K}.stats.scan.value`, undefined, "Sub-100ms"),
            label: t(`${K}.stats.scan.label`, undefined, "Gate scan, server-side"),
          },
          {
            value: t(`${K}.stats.night.value`, undefined, "15,000"),
            label: t(`${K}.stats.night.label`, undefined, "Scans in one night"),
          },
          {
            value: t(`${K}.stats.install.value`, undefined, "One tap"),
            label: t(`${K}.stats.install.label`, undefined, "Install from the browser"),
          },
          {
            value: t(`${K}.stats.pricing.value`, undefined, "Per org"),
            label: t(`${K}.stats.pricing.label`, undefined, "Never per seat"),
          },
        ]}
      />

      {/* Feature walk */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-xl">{t(`${K}.features.heading`, undefined, "What the field runs on it.")}</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--p-text-2)]">
          {t(
            `${K}.features.body`,
            undefined,
            "Every surface below is live today. None of it is a roadmap slide.",
          )}
        </p>
        <div className="mt-8">
          <FeatureGrid
            cols={3}
            features={[
              {
                icon: Clock,
                title: t(`${K}.features.shifts.title`, undefined, "Shifts and time clock"),
                body: t(
                  `${K}.features.shifts.body`,
                  undefined,
                  "Geo-verified clock-in against your time-clock zones, with breaks, meal credits, and a manual fallback for the corner of the lot where GPS gives up.",
                ),
              },
              {
                icon: QrCode,
                title: t(`${K}.features.gateScan.title`, undefined, "Gate scan, offline-first"),
                body: t(
                  `${K}.features.gateScan.body`,
                  undefined,
                  "QR and barcode, sub-100ms server-side. Accepted, duplicate, voided, not found, expired, wrong zone: each result is its own state, readable at arm's length.",
                ),
              },
              {
                icon: AlertTriangle,
                title: t(`${K}.features.incidents.title`, undefined, "Incidents"),
                body: t(
                  `${K}.features.incidents.body`,
                  undefined,
                  "File with photos, location, and witnesses. File anonymously if that is what it takes to get the report. Closing an injury or a major incident takes a manager sign-off.",
                ),
              },
              {
                icon: ClipboardList,
                title: t(`${K}.features.punch.title`, undefined, "Punch lists, daily logs, handovers"),
                body: t(
                  `${K}.features.punch.body`,
                  undefined,
                  "Walk the site, snag what is wrong, close it with photos. Daily logs and shift handovers leave the next crew a written trail instead of a hallway rumor.",
                ),
              },
              {
                icon: PackageCheck,
                title: t(`${K}.features.assets.title`, undefined, "Asset custody and GTIN scan"),
                body: t(
                  `${K}.features.assets.body`,
                  undefined,
                  "Scan the barcode already printed on the case. Check gear out to a person, see who holds what right now, and get it all back at load-out.",
                ),
              },
              {
                icon: BadgeCheck,
                title: t(`${K}.features.advancing.title`, undefined, "Advancing and credentials"),
                body: t(
                  `${K}.features.advancing.body`,
                  undefined,
                  "Tickets, credentials, radios, lodging: every assignment lands on the holder's own phone, with the scan code to prove it at the door.",
                ),
              },
            ]}
          />
        </div>
      </section>

      {/* Offline-first architecture */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface grid gap-10 p-10 md:grid-cols-2 md:items-start">
          <div>
            <div className="eyebrow eyebrow-accent flex items-center gap-2">
              <Wifi size={14} /> {t(`${K}.offline.eyebrow`, undefined, "Offline-first")}
            </div>
            <h2 className="hed-xl mt-3">
              {t(`${K}.offline.heading`, undefined, "Built for the venue with one bar of LTE.")}
            </h2>
            <p className="mt-4 text-sm text-[var(--p-text-2)]">
              {t(
                `${K}.offline.body1`,
                undefined,
                "COMPVSS is an installable web app. Open the link, tap Install, and it lives on the home screen as a full-screen launcher. No App Store review, no fleet update the morning of the show.",
              )}
            </p>
            <p className="mt-3 text-sm text-[var(--p-text-2)]">
              {t(
                `${K}.offline.body2`,
                undefined,
                "The scanner and the day's call sheet cache on the device. When the network drops, scans queue locally and replay in order the moment signal returns. Duplicates the device cannot confirm during an offline window are flagged pending, and the server reconciles them on sync.",
              )}
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              t(`${K}.offline.bullets.install`, undefined, "Installs from the browser in one tap"),
              t(`${K}.offline.bullets.queue`, undefined, "Offline scan queue replays in order, nothing drops"),
              t(
                `${K}.offline.bullets.states`,
                undefined,
                "Distinct scan states: accepted, duplicate, voided, not found, expired, wrong zone",
              ),
              t(`${K}.offline.bullets.geo`, undefined, "Geo-verified clock-in with accuracy bounds and a manual fallback"),
              t(`${K}.offline.bullets.permissions`, undefined, "Camera and GPS requested only when a surface needs them"),
              t(`${K}.offline.bullets.contrast`, undefined, "High-contrast screens, readable in daylight at the gate"),
            ].map((x) => (
              <li key={x} className="flex items-start gap-2">
                <CheckCircle2 size={16} className="mt-0.5 text-[var(--p-accent)]" />
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* One record store */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="eyebrow eyebrow-accent">{t(`${K}.recordStore.eyebrow`, undefined, "One record store")}</div>
        <h2 className="hed-xl mt-3">{t(`${K}.recordStore.heading`, undefined, "The field writes. Everyone reads.")}</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <p className="text-sm text-[var(--p-text-2)]">
            {t(
              `${K}.recordStore.col1`,
              undefined,
              "A scan at the gate is a row in the same org-scoped record store the production office reads. No export at midnight, no re-keying into a second system, no morning-after sync.",
            )}
          </p>
          <p className="text-sm text-[var(--p-text-2)]">
            {t(
              `${K}.recordStore.col2`,
              undefined,
              "Clock punches land as the time entries payroll settles from. An incident filed at the barricade pages the console the moment it is saved. The punch list a crew closes tonight is the one the office reviews tomorrow.",
            )}
          </p>
          <p className="text-sm text-[var(--p-text-2)]">
            {t(
              `${K}.recordStore.col3`,
              undefined,
              "Access is walled per organization at the database, and every stakeholder portal reads its own slice of the same rows. One truth, viewed from wherever you stand.",
            )}
          </p>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface flex flex-col items-start gap-6 p-10 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="hed-xl">{t(`${K}.pricingTeaser.heading`, undefined, "Per org. Never per seat.")}</h2>
            <p className="mt-3 max-w-xl text-sm text-[var(--p-text-2)]">
              {t(
                `${K}.pricingTeaser.body`,
                undefined,
                "Free forever for small teams, per-org pricing the whole way up. Invite the entire gate team in week one; the bill holds.",
              )}
            </p>
          </div>
          <Button href="/pricing">{t(`${K}.pricingTeaser.cta`, undefined, "See pricing")}</Button>
        </div>
      </section>

      <FAQSection
        title={t(`${K}.faq.title`, undefined, "COMPVSS, asked and answered")}
        faqs={[
          {
            q: t(`${K}.faq.join.q`, undefined, "How do crew join?"),
            a: t(
              `${K}.faq.join.a`,
              undefined,
              "Crew join an existing organization by invite or by org code, straight from the phone. Organizations themselves are created and configured in LEG3ND on the web, so the org is set up before the first crew member signs in.",
            ),
          },
          {
            q: t(`${K}.faq.native.q`, undefined, "Is COMPVSS a native iOS or Android app?"),
            a: t(
              `${K}.faq.native.a`,
              undefined,
              "No. It is an installable web app: open the URL, tap Install, and it runs full-screen from the home screen. No App Store review and no version drift across a 400-person gate team.",
            ),
          },
          {
            q: t(`${K}.faq.signal.q`, undefined, "What happens when the venue has no signal?"),
            a: t(
              `${K}.faq.signal.a`,
              undefined,
              "The scanner and the day's call sheet cache on the device. Scans queue locally and replay in order when signal returns; duplicates the device could not confirm are flagged pending and reconciled by the server on sync.",
            ),
          },
          {
            q: t(`${K}.faq.gateSpeed.q`, undefined, "How fast is the gate scan?"),
            a: t(
              `${K}.faq.gateSpeed.a`,
              undefined,
              "Sub-100ms server-side; a US cell connection adds roughly 200 to 400ms of round trip. Offline scans resolve instantly on the device.",
            ),
          },
          {
            q: t(`${K}.faq.anonymous.q`, undefined, "Can crew report incidents anonymously?"),
            a: t(
              `${K}.faq.anonymous.a`,
              undefined,
              "Yes. A reporter can file without attaching their identity to the record. Closing an injury or a major or critical incident still requires a manager sign-off, so anonymity never lowers the bar on follow-through.",
            ),
          },
          {
            q: t(`${K}.faq.cost.q`, undefined, "What does it cost?"),
            a: t(
              `${K}.faq.cost.a`,
              undefined,
              "Pricing is per organization, never per seat, with a free tier for small teams. Adding crew never raises the bill, which matters when your headcount triples the week of the show.",
            ),
          },
        ]}
      />

      <CTASection
        title={t(`${K}.cta.title`, undefined, "Put it on their phones.")}
        subtitle={t(
          `${K}.cta.subtitle`,
          undefined,
          "Installs from the browser in one tap. No App Store, no fleet update, ready before soundcheck.",
        )}
      />
    </div>
  );
}
