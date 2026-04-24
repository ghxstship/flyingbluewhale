// ISR (H2-08 / IK-030) — regenerate static HTML every 5 min.
// Shortens to 60s if editorial cadence picks up; `revalidate` alone is enough,
// no `dynamic = 'force-static'` because some pages read query params.
export const revalidate = 300;

import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, QrCode, Clock, Wifi, Camera, AlertTriangle, Home, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, productSchema } from "@/lib/seo";
export const metadata: Metadata = buildMetadata({
  title: "COMPVSS — The Open Deck",
  description:
    "The night, on the water. Gate scan, shift check-in, medic triage, crisis alerts, driver manifest, guard tour. Offline-first. Installs from the browser in one tap.",
  path: "/solutions/compvss",
  keywords: ["COMPVSS", "event ticket scan PWA", "offline ticket scanning", "production mobile app", "crew mobile app", "event check-in software"],
  ogImageEyebrow: "COMPVSS",
  ogImageTitle: "The Night, On the Water.",
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
        data={[productSchema({
            name: "COMPVSS — Field App",
            description: "The mobile field app for production crew. Ticket scan, clock-in, inventory, and incident reports — offline-ready on any phone.",
            url: "https://flyingbluewhale.app/solutions/compvss",
          }),
        ]}
      />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--org-primary)]">COMPVSS · The Open Deck</div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">The Night,<br />On the Water.</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
          Installs from the browser in one tap. Sub-100ms QR gate scans. Geo-verified shift check-ins. Medic triage. Crisis alerts. Driver manifests. Guard tours. Warehouse scans. Offline-first throughout. When the venue Wi-Fi retires, the deck sails on.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/signup">Book passage</Button>
          <Button href="/contact" variant="secondary">Captain&apos;s briefing</Button>
        </div>
      </section>

      {/* Modules */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">What the Crew Runs, Deck-Side.</h2>
        <div className="mt-8">
          <FeatureGrid
            cols={3}
            features={[
              { icon: Home, title: "Today", body: "Role-routed landing — call sheet, pinned tasks, tonight&apos;s shift." },
              { icon: QrCode, title: "Gate + ticket scan", body: "QR + barcode. Accreditation zone logic. Sub-100ms. Offline or on." },
              { icon: BookOpen, title: "Door pass", body: "Same KBYG as the portal — scoped crew-side to radio, PPE, SOPs." },
              { icon: Clock, title: "Shift", body: "Geo-verified clock-in / break / meal-credit / clock-out. Manual fallback included." },
              { icon: Camera, title: "Warehouse", body: "Pick / put-away scans. Offline queue replays in order. Nothing goes missing." },
              { icon: AlertTriangle, title: "Incident + medic + safeguarding", body: "Photos, location, witnesses. Admin + medic + safeguarding lead paged instantly. Encrypted at rest." },
            ]}
          />
        </div>
      </section>

      {/* Why offline-first matters */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface-raised grid gap-10 p-10 md:grid-cols-2 md:items-start">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--org-primary)]">
              <Wifi size={14} /> Offline-first
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Venue Wi-Fi Retires at Sunset. The Deck Doesn&apos;t.</h2>
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              Gate scan, manual lookup, tonight&apos;s call sheet — cached on device. Scans queue locally and replay in order the second signal returns. Nothing drops. Nobody waits.
            </p>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              Install from the browser — open the link, tap Install, full-screen launcher on the home screen. Done before soundcheck.
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              "Installs from the browser — one tap",
              "Offline scan queue replays in order. Zero drops.",
              "Precise at fifteen thousand per night",
              "Clear scan states — accepted · duplicate · voided · not found",
              "Geo-verified clock-in with accuracy bounds",
              "Camera + GPS requested only when needed",
              "Bottom tab bar — the five deck-side hits",
              "Compass yellow on every screen. Readable from across the deck.",
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
            a: "No. PWA. Open the URL, tap Install, full-screen launcher. No App Store review to wait on. No fleet update the morning of. No version drift across your four-hundred-person gate team.",
          },
          {
            q: "What if the venue has no cell signal?",
            a: "The scanner, tonight&apos;s call sheet, and the door pass cache on the device. Scans queue locally and replay in order the moment signal comes back. The tower&apos;s problem, not yours.",
          },
          {
            q: "How fast is the gate?",
            a: "Sub-100ms server-side. US cell adds 200–400ms round-trip. Offline scans are instant locally. Duplicates, voided, not-found — all distinct states, all on-screen in a glance.",
          },
          {
            q: "Offline check-in — really?",
            a: "Really. Scans queue on device. Replay in order when signal returns. During an offline window, duplicates the scanner can&apos;t yet confirm are flagged pending — the server reconciles on sync.",
          },
          {
            q: "Camera access?",
            a: "For QR + barcode scans. Manual input is the fallback for damaged codes or blocked permissions. The crew member at the gate never waits on IT.",
          },
        ]}
      />

      <CTASection title="Board the Deck." subtitle="Installs on any phone. No App Store. No fleet update. Ready in a tap." />
    </div>
  );
}
