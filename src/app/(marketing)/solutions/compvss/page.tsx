// ISR (H2-08 / IK-030) — regenerate static HTML every 5 min.
// Shortens to 60s if editorial cadence picks up; `revalidate` alone is enough,
// no `dynamic = 'force-static'` because some pages read query params.
export const revalidate = 300;

import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, QrCode, Clock, Wifi, Camera, AlertTriangle, Home, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/marketing/Breadcrumb";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, breadcrumbSchema, productSchema } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "COMPVSS — offline-first mobile PWA for production crew",
  description:
    "COMPVSS is flyingbluewhale's mobile field kit. Offline ticket scanning with race-safe atomic updates, geo-verified clock-in, inventory scan, incident reports, and the day's call sheet — all on the phone, all fast.",
  path: "/solutions/compvss",
  keywords: ["COMPVSS", "event ticket scan PWA", "offline ticket scanning", "production mobile app", "crew mobile app", "event check-in software"],
  ogImageEyebrow: "COMPVSS",
  ogImageTitle: "The mobile field kit for show day",
});

export default function CompvssPage() {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Solutions", path: "/solutions" },
    { name: "COMPVSS", path: "/solutions/compvss" },
  ];

  return (
    <div data-platform="compvss">
      <JsonLd
        data={[
          breadcrumbSchema(crumbs),
          productSchema({
            name: "COMPVSS — Mobile Field PWA",
            description: "Offline-first mobile progressive web app for production crew — ticketing, clock-in, inventory, incidents.",
            url: "https://flyingbluewhale.app/solutions/compvss",
          }),
        ]}
      />
      <Breadcrumbs crumbs={crumbs} />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--org-primary)]">COMPVSS · Mobile PWA</div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">The Mobile Field Kit.</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
          Install once from the browser. Service-worker cached. QR ticket scanning with race-safe atomic
          updates. Geo-verified clock-in with GPS fallback. Inventory scan. Incident reports. All on the phone,
          all fast, all offline-capable.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/signup">Start free</Button>
          <Button href="/contact" variant="secondary">Book a demo</Button>
        </div>
      </section>

      {/* Modules */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">What Crew Does in Compvss.</h2>
        <div className="mt-8">
          <FeatureGrid
            cols={3}
            features={[
              { icon: Home, title: "Today", body: "Role-routed landing — call sheet, pinned tasks, today's shift." },
              { icon: QrCode, title: "Check-in", body: "QR ticket scan. Race-safe via Postgres atomic update — duplicate scans rejected in < 100ms." },
              { icon: BookOpen, title: "Guide", body: "Same KBYG event guide as the portal, role-scoped to the crew persona (radio, SOPs, PPE)." },
              { icon: Clock, title: "Clock", body: "Geo-verified clock in / out. GPS with accuracy threshold; graceful fallback to manual." },
              { icon: Camera, title: "Inventory scan", body: "Scan equipment asset tags in / out. Offline queue syncs when connectivity returns." },
              { icon: AlertTriangle, title: "Incident report", body: "Photos, location, witnesses. Admin + EHS lead paged immediately." },
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
              A service worker caches the application shell on first install. Check-in, manual lookup, and the
              field home all load instantly from cache even with zero connectivity. Scans queue locally and
              sync when the network returns — we never drop a scan.
            </p>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              And we don't force-install native apps on your crew. COMPVSS is a progressive web app — open
              the link, tap "Add to Home Screen," done.
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              "Service-worker app shell cache",
              "Offline scan queue with replay",
              "Race-safe ticket scan (atomic Postgres UPDATE)",
              "Ticket-scan history + result (accepted/duplicate/voided/not-found)",
              "Geo-verified clock-in with accuracy bounds",
              "Camera + geolocation permissions managed per-shell",
              "Bottom tab bar with 5 primary actions",
              "Compass yellow brand scoped via data-platform=\"compvss\"",
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
            a: "No. It's a progressive web app (PWA). Open the URL on any phone, tap the browser's 'Install' or 'Add to Home Screen' action, and you get a full-screen icon that launches just like a native app. No App Store review, no build pipeline, no fragmentation.",
          },
          {
            q: "What happens if the venue has no cell signal?",
            a: "The app shell, today's data, and the check-in scanner all load from the service-worker cache. Scans queue locally and sync the moment you reconnect. You never lose a scan.",
          },
          {
            q: "How fast is ticket scanning?",
            a: "Sub-100ms server-side for a successful scan. The client issues a POST to /api/v1/tickets/scan; Postgres attempts an atomic UPDATE to 'scanned' state only if current status is 'issued'. Duplicates, voided tickets, and not-found are distinguished cleanly.",
          },
          {
            q: "Can COMPVSS do offline check-in?",
            a: "Queued scans are supported — the scanner falls back to local queueing if the network is down and replays when connectivity returns. The server is the source of truth for duplicate detection, so during the offline window the local client reports 'pending' for duplicates it cannot confirm.",
          },
          {
            q: "Does COMPVSS use the camera?",
            a: "Yes, optionally — for QR ticket scans and asset tag scans. The scanner accepts manual input as a fallback for damaged codes or blocked permissions.",
          },
        ]}
      />

      <CTASection title="Ship the field kit for show day" subtitle="Installs on any phone. No App Store required." />
    </div>
  );
}
