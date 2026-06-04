import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { resolveProposalContext, listChangeOrders } from "@/lib/proposals/portal/queries";
import { CO_STATE_LABEL, CO_STATE_VARIANT } from "@/lib/proposals/portal/types";
import { formatMoney } from "@/lib/i18n/format";
import { timeAgo } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string; proposalId: string }> }) {
  const { slug, proposalId } = await params;
  const ctx = await resolveProposalContext(slug, proposalId);
  if (!ctx) notFound();
  const cos = await listChangeOrders(proposalId);
  const base = `/p/${slug}/client/proposals/${proposalId}/change-orders`;
  const { t } = await getRequestT();

  return (
    <div className="space-y-4 p-6">
      <header className="surface flex items-end justify-between gap-4 p-5">
        <div>
          <div className="eyebrow text-xs text-[var(--text-muted)]">
            {t("p.client.changeOrders.eyebrow", undefined, "Change orders")}
          </div>
          <h1 className="text-lg font-semibold">
            {t("p.client.changeOrders.title", undefined, "Scope Changes After May 12 Lock")}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--text-muted)]">
            {t(
              "p.client.changeOrders.description",
              undefined,
              "Anything that wasn't in the signed SOW. Each change order moves through requested → priced → client decision.",
            )}
          </p>
        </div>
        <Button href={`${base}/new`}>{t("p.client.changeOrders.requestChange", undefined, "Request a Change")}</Button>
      </header>

      {cos.length === 0 ? (
        <div className="surface p-12 text-center text-[var(--text-muted)]">
          {t("p.client.changeOrders.empty", undefined, "No change orders yet.")}
        </div>
      ) : (
        <ul className="space-y-3">
          {cos.map((co) => (
            <li key={co.id}>
              <Link href={`${base}/${co.id}`} className="surface hover-lift block p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[var(--text-muted)]">#{co.number}</span>
                      <Badge variant={CO_STATE_VARIANT[co.state]}>{CO_STATE_LABEL[co.state]}</Badge>
                    </div>
                    <h2 className="mt-1 text-base font-semibold">{co.title}</h2>
                    {co.body && <p className="mt-1 line-clamp-2 text-sm text-[var(--text-muted)]">{co.body}</p>}
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-semibold">{formatMoney(co.delta_cents ?? 0)}</div>
                    <div className="mt-1 text-xs text-[var(--text-muted)]">
                      {co.decided_at
                        ? t(
                            "p.client.changeOrders.decidedAgo",
                            { time: timeAgo(co.decided_at) },
                            `Decided ${timeAgo(co.decided_at)}`,
                          )
                        : co.priced_at
                          ? t(
                              "p.client.changeOrders.pricedAgo",
                              { time: timeAgo(co.priced_at) },
                              `Priced ${timeAgo(co.priced_at)}`,
                            )
                          : t(
                              "p.client.changeOrders.requestedAgo",
                              { time: timeAgo(co.created_at) },
                              `Requested ${timeAgo(co.created_at)}`,
                            )}
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
