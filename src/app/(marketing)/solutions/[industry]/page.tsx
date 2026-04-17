import Link from "next/link";
import { Button } from "@/components/ui/Button";

const INDUSTRIES: Record<string, { title: string; blurb: string; highlights: string[] }> = {
  "live-events": {
    title: "Live events",
    blurb: "Music festivals, brand activations, touring.",
    highlights: ["Ticketing + on-site scan", "Artist advancing workflows", "Vendor Connect payouts", "KBYG guides per persona"],
  },
  fabrication: {
    title: "Fabrication",
    blurb: "Custom build, scenic, signage.",
    highlights: ["Fabrication orders with due dates", "Equipment + rental tracking", "Purchase orders + receiving", "Crew scheduling"],
  },
  touring: {
    title: "Touring",
    blurb: "Production management on the road.",
    highlights: ["Master schedule with ICS export", "Per-city advancing", "Per-diem advances", "Mobile PWA for crew"],
  },
  corporate: {
    title: "Corporate events",
    blurb: "Product launches, AGMs, internal summits.",
    highlights: ["Client proposals + e-sign", "Invoicing + Stripe", "Vendor COI tracking", "Proposal → project handoff"],
  },
};

export default async function SolutionPage({ params }: { params: Promise<{ industry: string }> }) {
  const { industry } = await params;
  const info = INDUSTRIES[industry] ?? { title: industry, blurb: "Solution page coming soon.", highlights: [] };
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--org-primary)]">Solutions</div>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">{info.title}</h1>
      <p className="mt-4 text-sm text-[var(--text-secondary)]">{info.blurb}</p>
      {info.highlights.length > 0 && (
        <ul className="mt-6 space-y-1 text-sm text-[var(--text-secondary)]">
          {info.highlights.map((h) => <li key={h}>· {h}</li>)}
        </ul>
      )}
      <div className="mt-8 flex gap-2">
        <Button href="/signup">Start free</Button>
        <Button href="/contact" variant="secondary">Talk to sales</Button>
      </div>
      <div className="mt-8"><Link href="/" className="text-sm text-[var(--org-primary)]">← Back home</Link></div>
    </div>
  );
}
