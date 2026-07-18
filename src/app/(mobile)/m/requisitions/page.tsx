import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { EmptyState } from "@/components/ui/EmptyState";
import { Crumbs, Fab, KIcon } from "@/components/mobile/kit";

export const dynamic = "force-dynamic";

const STATE_TONE: Record<string, string> = {
  draft: "neutral",
  submitted: "warn",
  approved: "ok",
  rejected: "danger",
  ordered: "info",
};

/**
 * COMPVSS · Requisitions — what you've asked the org to buy.
 *
 * Scoped to the viewer, deliberately. RLS on `requisitions` is org-level,
 * so it is no backstop for a personal surface — the same shape as D6/D16,
 * where "My Tasks" showed 201 tasks of which 2 were the viewer's. A manager
 * reviewing the org's requisitions does that on the console, which is built
 * for it.
 */
export default async function RequisitionsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div className="screen">{t("common.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }

  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("requisitions")
    .select("id, title, description, estimated_cents, requisition_state, created_at")
    .eq("org_id", session.orgId)
    .eq("requester_id", session.userId)
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = data ?? [];

  return (
    <div className="screen screen-anim">
      {/* Kit 32 C1: the finance → PO record path gets its trail. */}
      <Crumbs
        items={[
          { label: t("m.reqs.crumbMore", undefined, "More"), href: "/m/more" },
          { label: t("m.finance.title", undefined, "Finance"), href: "/m/finance" },
          { label: t("m.reqs.title", undefined, "Purchase Requests") },
        ]}
      />
      <div className="scr-eye">
        {rows.length === 1
          ? t("m.reqs.eyebrowOne", undefined, "1 Request")
          : t("m.reqs.eyebrow", { count: rows.length }, `${rows.length} Requests`)}
      </div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.reqs.title", undefined, "Purchase Requests")}
      </h1>

      <Link
        href="/m/requisitions/new"
        className="ps-btn ps-btn--cta ps-btn--lg"
        style={{ width: "100%", justifyContent: "center", marginBottom: 12, textDecoration: "none" }}
      >
        <KIcon name="Plus" size={16} /> {t("m.reqs.new", undefined, "Request A Purchase")}
      </Link>

      {rows.length === 0 ? (
        <EmptyState
          size="compact"
          title={t("m.reqs.emptyTitle", undefined, "Nothing Requested")}
          description={t(
            "m.reqs.emptyBody",
            undefined,
            "Need something bought for the job? Raise it here and your manager picks it up.",
          )}
        />
      ) : (
        rows.map((r) => (
          <div className="item" key={r.id as string} style={{ display: "block" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="t">{r.title as string}</div>
                <div className="s">
                  {[
                    r.estimated_cents != null ? fmt.money(r.estimated_cents as number) : null,
                    fmt.relative(r.created_at as string),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </div>
              <span className={`ps-badge ps-badge--${STATE_TONE[r.requisition_state as string] ?? "neutral"}`}>
                {r.requisition_state as string}
              </span>
            </div>
            {r.description ? (
              <p className="form-intro" style={{ margin: "8px 0 0" }}>
                {r.description as string}
              </p>
            ) : null}
          </div>
        ))
      )}

      {/* Kit-29 spec: FAB = New Requisition. */}
      <Fab href="/m/requisitions/new" label={t("m.requisitions.newCta", undefined, "Request A Purchase")} />
    </div>
  );
}
