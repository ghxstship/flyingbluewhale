// ISR — regenerate static HTML every 5 min.
export const revalidate = 300;

import type { Metadata } from "next";
import { CheckCircle2, QrCode, Clock, Wifi, Camera, AlertTriangle, Home, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, productSchema } from "@/lib/seo";
import { urlFor } from "@/lib/urls";

export const metadata: Metadata = buildMetadata({
  title: "COMPVSS — The Field",
  description:
    "Offline-first PWA. Sub-100ms gate scan. Shift clock-in, daily log, incident, medic, driver, guard, warehouse. Installs from the browser in one tap.",
  path: "/solutions/compvss",
  keywords: [
    "COMPVSS",
    "event ticket scan PWA",
    "offline ticket scanning",
    "production mobile app",
    "crew mobile app",
    "event check-in software",
  ],
  ogImageEyebrow: "COMPVSS",
  ogImageTitle: "Offline. Sub-100ms.",
});

export default function CompvssPage() {
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Solutions", href: "/solutions" },
    { label: "COMPVSS", href: "/solutions/compvss" },
  ];

  return (
    <div data-platform="compvss">
      <JsonLd
        data={[
          productSchema({
            name: "COMPVSS — The Field",
            description:
              "Offline-first PWA for production crew. Gate scan, clock-in, incident, medic, driver, guard, warehouse.",
            url: urlFor("marketing", "/solutions/compvss"),
          }),
        ]}
      />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="text-xs font-semibold tracking-[0.25em] text-[var(--org-primary)] uppercase">
          COMPVSS · The Field
        </div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">
          Offline.
          <br />
          Sub-100ms.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
          Installs from the browser in one tap. Gate scan, shift clock-in, medic triage, incident, driver run, guard
          tour, warehouse, daily safety brief. Works on one-bar LTE.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/signup">Open the Console</Button>
          <Button href="/contact" variant="secondary">
            Talk to the Studio
          </Button>
        </div>
      </section>

      {/* Modules */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">What the Crew Runs in the Field.</h2>
        <div className="mt-8">
          <FeatureGrid
            cols={3}
            features={[
              {
                icon: Home,
                title: "Today",
                body: "Role-routed landing — call sheet, pinned tasks, tonight&apos;s shift.",
              },
              {
                icon: QrCode,
                title: "Gate + ticket scan",
                body: "QR + barcode. Accreditation zone logic. Sub-100ms. Offline or on.",
              },
              {
                icon: BookOpen,
                title: "Door pass",
                body: "Same KBYG as the portal — scoped crew-side to radio, PPE, SOPs.",
              },
              {
                icon: Clock,
                title: "Shift",
                body: "Geo-verified clock-in / break / meal-credit / clock-out. Manual fallback included.",
              },
              {
                icon: Camera,
                title: "Warehouse",
                body: "Pick / put-away scans. Offline queue replays in order. Nothing goes missing.",
              },
              {
                icon: AlertTriangle,
                title: "Incident · medic · safeguarding",
                body: "Photos, location, witnesses. Admin + medic + safeguarding lead paged instantly. Encrypted at rest.",
              },
            ]}
          />
        </div>
      </section>

      {/* Offline-first */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface grid gap-10 p-10 md:grid-cols-2 md:items-start">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] text-[var(--org-primary)] uppercase">
              <Wifi size={14} /> Offline-first
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">The Cell Tower Is Not Your Problem.</h2>
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              Gate scan, manual lookup, tonight&apos;s call sheet — cached on device. Scans queue locally and replay in
              order the second signal returns. Nothing drops. Nobody waits.
            </p>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              Install from the browser — open the link, tap Install, full-screen launcher on the home screen. Done
              before soundcheck.
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              "Installs from the browser — one tap",
              "Offline scan queue replays in order. Zero drops.",
              "Tested at 15,000 per night",
              "Clear scan states — accepted · duplicate · voided · not found",
              "Geo-verified clock-in with accuracy bounds",
              "Camera + GPS requested only when needed",
              "Bottom tab bar — five field-side actions",
              "High-contrast every screen. Readable across the gate.",
            ].map((x) => (
              <li key={x} className="flex items-start gap-2">
                <CheckCircle2 size={16} className="mt-0.5 text-[var(--org-primary)]" />
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <FAQSection
        title="COMPVSS · FAQ"
        faqs={[
          {
            q: "Is COMPVSS a native iOS / Android app?",
            a: "No. PWA. Open the URL, tap Install, full-screen launcher. No App Store review. No fleet update the morning of. No version drift across your 400-person gate team.",
          },
          {
            q: "What if the venue has no cell signal?",
            a: "The scanner, tonight's call sheet, and the door pass cache on device. Scans queue locally and replay in order the moment signal returns.",
          },
          {
            q: "How fast is the gate?",
            a: "Sub-100ms server-side. US cell adds 200–400ms round-trip. Offline scans are instant locally. Duplicates, voided, not-found — distinct states, all on-screen in a glance.",
          },
          {
            q: "Offline check-in — really?",
            a: "Really. Scans queue on device. Replay in order when signal returns. During an offline window, duplicates the scanner can't yet confirm are flagged pending — the server reconciles on sync.",
          },
          {
            q: "Camera access?",
            a: "For QR + barcode scans. Manual input is the fallback for damaged codes or blocked permissions. The crew member at the gate never waits on IT.",
          },
        ]}
      />

      <CTASection
        title="Open the Field App."
        subtitle="Installs on any phone. No App Store. No fleet update. Ready in a tap."
        primaryLabel="Open the console"
        primaryHref="/signup"
        secondaryLabel="Talk to the studio"
        secondaryHref="/contact"
      />
    </div>
  );
}
