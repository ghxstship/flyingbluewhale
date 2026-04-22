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
  title: "COMPVSS — the field app for production crew",
  description:
    "COMPVSS is the field kit from Second Star Technologies. Ticket scan with zero duplicates, geo-verified clock-in, inventory, incident reports, and today's call sheet — from any phone. Keeps working when venue signal drops.",
  path: "/solutions/compvss",
  keywords: ["COMPVSS", "event ticket scan PWA", "offline ticket scanning", "production mobile app", "crew mobile app", "event check-in software"],
  ogImageEyebrow: "COMPVSS",
  ogImageTitle: "The mobile field kit for show day",
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
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--org-primary)]">COMPVSS · Field kit</div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">Own the Field.</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
          Install straight from the browser — no app store. QR ticket scan with zero duplicates. Geo-verified
          clock-in. Inventory. Incident reports. All from any phone. All fast. And when the venue drops signal,
          it keeps working.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/signup">Start free</Button>
          <Button href="/contact" variant="secondary">Book a demo</Button>
        </div>
      </section>

      {/* Modules */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">What Crew Does in COMPVSS.</h2>
        <div className="mt-8">
          <FeatureGrid
            cols={3}
            features={[
              { icon: Home, title: "Today", body: "Role-routed landing — call sheet, pinned tasks, today's shift." },
              { icon: QrCode, title: "Check-in", body: "QR ticket scan. Zero duplicates at the gate. Sub-100ms server-side." },
              { icon: BookOpen, title: "Guide", body: "Same KBYG as the portal, scoped to the crew view — radio channels, SOPs, PPE." },
              { icon: Clock, title: "Clock", body: "Geo-verified clock-in and clock-out, with a graceful manual fallback." },
              { icon: Camera, title: "Inventory scan", body: "Scan asset tags in and out. Offline queue syncs when signal returns." },
              { icon: AlertTriangle, title: "Incident report", body: "Photos, location, witnesses. Admin and EHS paged immediately." },
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
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Venues Kill Signal. We Don't Care.</h2>
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              Check-in, manual lookup, today's call sheet — all cached on the device. Scans queue locally and
              replay in order the moment signal returns. No scan ever gets lost.
            </p>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              And we don't force your crew through an app store. COMPVSS installs straight from the browser —
              open the link, add to the home screen, done.
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              "Installs from the browser — no app store",
              "Offline scan queue replays in order",
              "Zero duplicates at the gate, under load",
              "Clear scan results — accepted, duplicate, voided, not found",
              "Geo-verified clock-in with accuracy bounds",
              "Camera and GPS requested only where needed",
              "Bottom tab bar with the five actions that matter",
              "Compass yellow brand on every screen",
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
            q: "Is COMPVSS a native iOS or Android app?",
            a: "No — and that's the point. It's a mobile app you install straight from the browser. Open the URL, tap Install, and you get a full-screen launcher indistinguishable from native. No app store review, no fleet updates, no version fragmentation.",
          },
          {
            q: "What happens if the venue has no cell signal?",
            a: "The scanner, today's call sheet, and the guide are cached on the device. Scans queue locally and replay in order the moment connectivity returns. No scan is ever dropped.",
          },
          {
            q: "How fast is ticket scanning?",
            a: "Sub-100ms server-side. A typical US cell connection adds 200-400ms end to end. Offline scans are instant locally. Duplicates, voided tickets, and not-found states are distinguished cleanly on the scanner.",
          },
          {
            q: "Can COMPVSS do offline check-in?",
            a: "Yes. Scans queue on the device when there's no signal and replay in order when it returns. During an offline window, the scanner flags duplicates it can't confirm as pending — the server resolves them when it syncs.",
          },
          {
            q: "Does COMPVSS use the camera?",
            a: "Yes — for QR ticket scans and asset tag scans. Manual input is supported as a fallback for damaged codes or blocked permissions.",
          },
        ]}
      />

      <CTASection title="Ship the field kit for show day" subtitle="Installs on any phone. No app store required." />
    </div>
  );
}
