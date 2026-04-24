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
  title: "COMPVSS — the crew PWA that runs the night",
  description:
    "Gate scan, shift check-in, medic triage, crisis alerts, driver manifest, guard tour. Offline-first. Runs on any phone from the browser — no app store. When the venue signal dies, you don&apos;t.",
  path: "/solutions/compvss",
  keywords: ["COMPVSS", "event ticket scan PWA", "offline ticket scanning", "production mobile app", "crew mobile app", "event check-in software"],
  ogImageEyebrow: "COMPVSS",
  ogImageTitle: "Runs the night. From your pocket.",
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
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--org-primary)]">COMPVSS · the floor</div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">Runs the Night.<br />From Your Pocket.</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
          Install from the browser in one tap — no app store. QR gate scans in under 100ms. Geo-verified shift check-ins. Medic triage. Crisis alerts. Driver manifests. Guard tours. Warehouse scans. Offline-first everywhere. When the venue Wi-Fi goes home, you stay on.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/signup">Doors open</Button>
          <Button href="/contact" variant="secondary">Backstage walkthrough</Button>
        </div>
      </section>

      {/* Modules */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">What the Crew Actually Runs.</h2>
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
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Venue Wi-Fi Died. The Show Didn&apos;t.</h2>
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              Gate scan, manual lookup, tonight&apos;s call sheet — cached on device. Scans queue locally and replay in order the second signal comes back. Nothing drops. Nobody waits.
            </p>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              No app store. No review queue. No version drift across the crew. Open the link, tap Install, full-screen launcher on the home screen. Done before soundcheck.
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              "Installs from the browser — zero app store drama",
              "Offline scan queue replays in order. Zero drops",
              "No duplicates at the gate, even under 15k/night",
              "Clear scan states — accepted · duplicate · voided · not found",
              "Geo-verified clock-in with accuracy bounds",
              "Camera + GPS requested only when needed",
              "Bottom tab bar — the five hits that matter tonight",
              "Compass yellow on every screen. You&apos;ll know it from across the floor.",
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
            a: "No — and that&apos;s the whole point. PWA. Open the URL, tap Install, full-screen launcher. No App Store review to wait on. No fleet update the morning of. No version drift across your 400-person gate team.",
          },
          {
            q: "What if the venue has no cell signal?",
            a: "The scanner, tonight&apos;s call sheet, and the door pass cache on the device. Scans queue locally and replay in order the moment signal comes back. No scan ever gets lost. The tower&apos;s problem, not yours.",
          },
          {
            q: "How fast is the gate?",
            a: "Sub-100ms server-side. US cell adds 200-400ms round-trip. Offline scans are instant locally. Duplicates, voided, not-found — all distinct scan states, all on-screen in a glance.",
          },
          {
            q: "Offline check-in — does it really work?",
            a: "Yes. Scans queue on device. Replay in order when signal returns. During an offline window, duplicates the scanner can&apos;t yet confirm are flagged pending — the server reconciles on sync.",
          },
          {
            q: "Camera access?",
            a: "Yes — for QR + barcode scans. Manual input is the fallback for damaged codes or blocked permissions. The crew member at the gate never waits on IT.",
          },
        ]}
      />

      <CTASection title="Ship the Night. Run It From Your Pocket." subtitle="Installs on any phone. No App Store. No fleet update. Ready in a tap." />
    </div>
  );
}
