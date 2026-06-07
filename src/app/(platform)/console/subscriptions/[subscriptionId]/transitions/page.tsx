import { notFound } from "next/navigation";
import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { getSubscription, listSubscriptionTransitions } from "@/lib/subscriptions";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function SubscriptionTransitionsPage({ params }: { params: Promise<{ subscriptionId: string }> }) {
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const { subscriptionId } = await params;
  const sub = await getSubscription(session.orgId, subscriptionId);
  if (!sub) notFound();
  const transitions = await listSubscriptionTransitions(session.orgId, subscriptionId);
  const { t } = await getRequestT();

  return (
    <>
      <ModuleHeader
        eyebrow={
          (
            <Link href={`/console/subscriptions/${sub.id}`} className="hover:underline">
              ← {sub.label}
            </Link>
          ) as unknown as string
        }
        title={t("console.subscriptions.transitions.title", undefined, "State Transitions")}
        subtitle={t(
          "console.subscriptions.transitions.subtitle",
          { count: transitions.length },
          `${transitions.length} append-only entries`,
        )}
      />
      <div className="page-content">
        <div className="surface overflow-hidden">
          <table className="ps-table">
            <thead>
              <tr>
                <th>{t("console.subscriptions.transitions.col.when", undefined, "When")}</th>
                <th>{t("console.subscriptions.transitions.col.from", undefined, "From")}</th>
                <th>{t("console.subscriptions.transitions.col.to", undefined, "To")}</th>
                <th>{t("console.subscriptions.transitions.col.reason", undefined, "Reason")}</th>
                <th>{t("console.subscriptions.transitions.col.by", undefined, "By")}</th>
                <th>{t("console.subscriptions.transitions.col.stripeEvent", undefined, "Stripe Event")}</th>
              </tr>
            </thead>
            <tbody>
              {transitions.map((row) => (
                <tr key={row.id}>
                  <td className="font-mono text-xs">{new Date(row.transitioned_at).toLocaleString()}</td>
                  <td className="font-mono text-xs">
                    {row.from_state ?? t("console.subscriptions.transitions.initial", undefined, "(initial)")}
                  </td>
                  <td className="font-mono text-xs font-bold">{row.to_state}</td>
                  <td>{row.reason ?? "—"}</td>
                  <td className="font-mono text-xs">{row.transitioned_by ?? "—"}</td>
                  <td className="font-mono text-xs">{row.stripe_event_id ?? "—"}</td>
                </tr>
              ))}
              {transitions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center">
                    <EmptyState
                      size="compact"
                      title={t("console.subscriptions.transitions.empty", undefined, "No transitions yet")}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
