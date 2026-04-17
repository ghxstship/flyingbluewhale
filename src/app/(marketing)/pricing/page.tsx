import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const TIERS = [
  { tier: "Portal", price: "Free", per: "forever", features: ["Basic project + ticketing", "Up to 3 users", "Community support"], cta: "Start free", href: "/signup" },
  { tier: "Starter", price: "$49", per: "month", features: ["Invoicing, expenses, tasks", "Up to 10 users", "Email support"], cta: "Start trial", href: "/signup" },
  { tier: "Professional", price: "$199", per: "month", features: ["Full finance, procurement, AI", "Unlimited users", "Priority support"], cta: "Start trial", href: "/signup", highlight: true },
  { tier: "Enterprise", price: "Custom", per: "", features: ["SSO, SCIM, audit", "Custom integrations", "Dedicated CSM"], cta: "Talk to sales", href: "/contact" },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="text-center">
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--org-primary)]">Pricing</div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Pick a tier, scale up when you need</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-[var(--text-secondary)]">
          Every tier includes RLS-backed org scoping, Supabase-native auth, and our REST API. Upgrade any time.
        </p>
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-4">
        {TIERS.map((t) => (
          <div key={t.tier} className={`surface p-6 ${t.highlight ? "ring-2 ring-[var(--org-primary)]" : ""}`}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">{t.tier}</div>
              {t.highlight && <Badge variant="brand">Most popular</Badge>}
            </div>
            <div className="mt-4">
              <span className="text-2xl font-semibold tracking-tight">{t.price}</span>
              {t.per && <span className="text-sm text-[var(--text-muted)]"> / {t.per}</span>}
            </div>
            <ul className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
              {t.features.map((f) => <li key={f}>· {f}</li>)}
            </ul>
            <div className="mt-6">
              <Button href={t.href} variant={t.highlight ? "primary" : "secondary"} className="w-full">
                {t.cta}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
