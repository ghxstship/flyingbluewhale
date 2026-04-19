import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

const TIERS = [
  { tier: "access", price: "Free", features: ["Basic project + ticketing", "Up to 3 users", "Community support"] },
  { tier: "core", price: "$49/mo", features: ["Invoicing, expenses, tasks", "Up to 10 users", "Email support"] },
  { tier: "professional", price: "$199/mo", features: ["Full finance, procurement, AI", "Unlimited users", "Priority support"] },
  { tier: "enterprise", price: "Contact sales", features: ["SSO, SCIM, audit", "Custom integrations", "Dedicated CSM"] },
];

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  if (!hasSupabase) return <><ModuleHeader title="Billing" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>;
  const session = await requireSession();
  const supabase = await createClient();
  const { data: org } = await supabase.from("orgs").select("tier").eq("id", session.orgId).maybeSingle();
  const current = org?.tier ?? "portal";

  return (
    <>
      <ModuleHeader eyebrow="Settings" title="Billing" subtitle={`Currently on ${current}`} />
      <div className="page-content space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          {TIERS.map((t) => (
            <div key={t.tier} className={`surface p-5 ${t.tier === current ? "ring-2 ring-[var(--org-primary)]" : ""}`}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold capitalize">{t.tier}</div>
                {t.tier === current && <Badge variant="brand">Current</Badge>}
              </div>
              <div className="mt-2 text-lg font-semibold tracking-tight">{t.price}</div>
              <ul className="mt-3 space-y-1 text-xs text-[var(--text-secondary)]">
                {t.features.map((f) => <li key={f}>· {f}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="surface p-5 text-sm text-[var(--text-muted)]">
          Stripe billing portal launches from here. Set <code className="font-mono">STRIPE_SECRET_KEY</code> in env, then we mint a checkout session per seat.
          <div className="mt-4"><Button variant="secondary" disabled>Open Stripe portal</Button></div>
        </div>
      </div>
    </>
  );
}
