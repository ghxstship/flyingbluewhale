import { notFound } from "next/navigation";
import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { getSubscription, listSubscriptionTransitions, SUBSCRIPTION_TRANSITION_GRAPH } from "@/lib/subscriptions";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import { getRequestFormatters } from "@/lib/i18n/request";
import { SubscriptionStateControls } from "./SubscriptionStateControls";

export const dynamic = "force-dynamic";

export default async function SubscriptionDetailPage({ params }: { params: Promise<{ subscriptionId: string }> }) {
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const { subscriptionId } = await params;
  const fmtIntl = await getRequestFormatters();
  const sub = await getSubscription(session.orgId, subscriptionId);
  if (!sub) notFound();

  const transitions = await listSubscriptionTransitions(session.orgId, subscriptionId);
  const allowedNext = SUBSCRIPTION_TRANSITION_GRAPH[sub.state];

  return (
    <>
      <ModuleHeader
        eyebrow="Subscription"
        title={sub.label}
        subtitle={`${sub.kind} · ${sub.renewal_cadence_months ? `${sub.renewal_cadence_months}-month renewal` : "No cadence"} · Created ${timeAgo(sub.created_at)}`}
      />
      <div className="page-content space-y-6">
        <section className="surface space-y-4 p-6">
          <h2 className="text-sm font-semibold tracking-wide uppercase">State</h2>
          <div className="flex items-center gap-3">
            <Badge variant="default" className="text-base">
              {sub.state}
            </Badge>
            <span className="text-sm text-[var(--text-secondary)]">
              Allowed next: {allowedNext.length === 0 ? "—" : allowedNext.join(", ")}
            </span>
          </div>
          <SubscriptionStateControls subscriptionId={sub.id} currentState={sub.state} allowedNext={allowedNext} />
        </section>

        <section className="surface space-y-3 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide uppercase">Lifecycle Timeline</h2>
            <Link href={`/console/subscriptions/${sub.id}/transitions`} className="text-xs underline">
              Full transitions log →
            </Link>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Field label="Started" value={sub.started_at ? fmtIntl.dateTime(sub.started_at) : "—"} />
            <Field label="Trial ends" value={sub.trial_ends_at ? fmtIntl.dateTime(sub.trial_ends_at) : "—"} />
            <Field label="Last renewed" value={sub.renewed_at ? fmtIntl.dateTime(sub.renewed_at) : "—"} />
            <Field label="Lapsed at" value={sub.lapsed_at ? fmtIntl.dateTime(sub.lapsed_at) : "—"} />
            <Field
              label="Reactivated at"
              value={sub.reactivated_at ? fmtIntl.dateTime(sub.reactivated_at) : "—"}
            />
            <Field label="Churned at" value={sub.churned_at ? fmtIntl.dateTime(sub.churned_at) : "—"} />
          </dl>
        </section>

        <section className="surface space-y-3 p-6">
          <h2 className="text-sm font-semibold tracking-wide uppercase">Recent Transitions ({transitions.length})</h2>
          {transitions.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">No transitions logged yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {transitions.slice(0, 8).map((t) => (
                <li key={t.id} className="border-b border-[var(--border-color)] pb-2 last:border-0">
                  <span className="font-mono text-xs">
                    {t.from_state ?? "(initial)"} → <strong>{t.to_state}</strong>
                  </span>{" "}
                  · <span className="text-[var(--text-secondary)]">{timeAgo(t.transitioned_at)}</span>
                  {t.reason ? <span className="ml-2">{t.reason}</span> : null}
                  {t.stripe_event_id ? (
                    <span className="ml-2 font-mono text-xs">[stripe:{t.stripe_event_id}]</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs tracking-wide text-[var(--text-secondary)] uppercase">{label}</dt>
      <dd className="font-mono text-xs">{value}</dd>
    </div>
  );
}
