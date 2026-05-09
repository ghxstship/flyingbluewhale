import { notFound } from "next/navigation";
import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { getSubscription, listSubscriptionTransitions } from "@/lib/subscriptions";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function SubscriptionTransitionsPage({ params }: { params: Promise<{ subscriptionId: string }> }) {
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const { subscriptionId } = await params;
  const sub = await getSubscription(session.orgId, subscriptionId);
  if (!sub) notFound();
  const transitions = await listSubscriptionTransitions(session.orgId, subscriptionId);

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
        title="State Transitions"
        subtitle={`${transitions.length} append-only entries`}
      />
      <div className="page-content">
        <div className="surface overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>When</th>
                <th>From</th>
                <th>To</th>
                <th>Reason</th>
                <th>By</th>
                <th>Stripe Event</th>
              </tr>
            </thead>
            <tbody>
              {transitions.map((t) => (
                <tr key={t.id}>
                  <td className="font-mono text-xs">{new Date(t.transitioned_at).toLocaleString()}</td>
                  <td className="font-mono text-xs">{t.from_state ?? "(initial)"}</td>
                  <td className="font-mono text-xs font-bold">{t.to_state}</td>
                  <td>{t.reason ?? "—"}</td>
                  <td className="font-mono text-xs">{t.transitioned_by ?? "—"}</td>
                  <td className="font-mono text-xs">{t.stripe_event_id ?? "—"}</td>
                </tr>
              ))}
              {transitions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[var(--text-secondary)]">
                    No transitions yet.
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
