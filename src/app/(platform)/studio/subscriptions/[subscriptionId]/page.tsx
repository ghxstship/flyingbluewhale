import { notFound } from "next/navigation";
import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { getSubscription, listSubscriptionTransitions, SUBSCRIPTION_TRANSITION_GRAPH } from "@/lib/subscriptions";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { SubscriptionStateControls } from "./SubscriptionStateControls";

export const dynamic = "force-dynamic";

export default async function SubscriptionDetailPage({ params }: { params: Promise<{ subscriptionId: string }> }) {
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const { subscriptionId } = await params;
  const sub = await getSubscription(session.orgId, subscriptionId);
  if (!sub) notFound();

  const transitions = await listSubscriptionTransitions(session.orgId, subscriptionId);
  const allowedNext = SUBSCRIPTION_TRANSITION_GRAPH[sub.state];
  const { t } = await getRequestT();

  const cadenceLabel = sub.renewal_cadence_months
    ? t(
        "console.subscriptions.detail.renewalCadence",
        { months: sub.renewal_cadence_months },
        `${sub.renewal_cadence_months}-month renewal`,
      )
    : t("console.subscriptions.detail.noCadence", undefined, "No cadence");
  const createdLabel = t(
    "console.subscriptions.detail.createdAt",
    { time: timeAgo(sub.created_at) },
    `Created ${timeAgo(sub.created_at)}`,
  );

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.subscriptions.detail.eyebrow", undefined, "Subscription")}
        title={sub.label}
        subtitle={`${sub.kind} · ${cadenceLabel} · ${createdLabel}`}
      />
      <div className="page-content space-y-6">
        <section className="surface space-y-4 p-6">
          <h2 className="text-sm font-semibold tracking-wide uppercase">
            {t("console.subscriptions.detail.state", undefined, "State")}
          </h2>
          <div className="flex items-center gap-3">
            <Badge variant="default" className="text-base">
              {sub.state}
            </Badge>
            <span className="text-sm text-[var(--p-text-2)]">
              {t("console.subscriptions.detail.allowedNext", undefined, "Allowed next:")}{" "}
              {allowedNext.length === 0 ? "—" : allowedNext.join(", ")}
            </span>
          </div>
          <SubscriptionStateControls subscriptionId={sub.id} currentState={sub.state} allowedNext={allowedNext} />
        </section>

        <section className="surface space-y-3 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide uppercase">
              {t("console.subscriptions.detail.lifecycleTimeline", undefined, "Lifecycle Timeline")}
            </h2>
            <Link href={`/studio/subscriptions/${sub.id}/transitions`} className="text-xs underline">
              {t("console.subscriptions.detail.fullTransitionsLog", undefined, "Full transitions log →")}
            </Link>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Field
              label={t("console.subscriptions.detail.started", undefined, "Started")}
              value={sub.started_at ? new Date(sub.started_at).toLocaleString() : "—"}
            />
            <Field
              label={t("console.subscriptions.detail.trialEnds", undefined, "Trial ends")}
              value={sub.trial_ends_at ? new Date(sub.trial_ends_at).toLocaleString() : "—"}
            />
            <Field
              label={t("console.subscriptions.detail.lastRenewed", undefined, "Last renewed")}
              value={sub.renewed_at ? new Date(sub.renewed_at).toLocaleString() : "—"}
            />
            <Field
              label={t("console.subscriptions.detail.lapsedAt", undefined, "Lapsed at")}
              value={sub.lapsed_at ? new Date(sub.lapsed_at).toLocaleString() : "—"}
            />
            <Field
              label={t("console.subscriptions.detail.reactivatedAt", undefined, "Reactivated at")}
              value={sub.reactivated_at ? new Date(sub.reactivated_at).toLocaleString() : "—"}
            />
            <Field
              label={t("console.subscriptions.detail.churnedAt", undefined, "Churned at")}
              value={sub.churned_at ? new Date(sub.churned_at).toLocaleString() : "—"}
            />
          </dl>
        </section>

        <section className="surface space-y-3 p-6">
          <h2 className="text-sm font-semibold tracking-wide uppercase">
            {t(
              "console.subscriptions.detail.recentTransitions",
              { count: transitions.length },
              `Recent Transitions (${transitions.length})`,
            )}
          </h2>
          {transitions.length === 0 ? (
            <p className="text-sm text-[var(--p-text-2)]">
              {t("console.subscriptions.detail.noTransitions", undefined, "No transitions logged yet.")}
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {transitions.slice(0, 8).map((row) => (
                <li key={row.id} className="border-b border-[var(--p-border)] pb-2 last:border-0">
                  <span className="font-mono text-xs">
                    {row.from_state ?? t("console.subscriptions.detail.initialState", undefined, "(initial)")} →{" "}
                    <strong>{row.to_state}</strong>
                  </span>{" "}
                  · <span className="text-[var(--p-text-2)]">{timeAgo(row.transitioned_at)}</span>
                  {row.reason ? <span className="ms-2">{row.reason}</span> : null}
                  {row.stripe_event_id ? (
                    <span className="ms-2 font-mono text-xs">[stripe:{row.stripe_event_id}]</span>
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
      <dt className="text-xs tracking-wide text-[var(--p-text-2)] uppercase">{label}</dt>
      <dd className="font-mono text-xs">{value}</dd>
    </div>
  );
}
