import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataView } from "@/components/views/DataViewServer";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { listSubscriptions, type Subscription } from "@/lib/subscriptions";
import { timeAgo, toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function SubscriptionsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title={t("console.subscriptions.title", undefined, "Subscriptions")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.subscriptions.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const rows = await listSubscriptions(session.orgId);
  const active = rows.filter((r) => r.state === "ACTIVE" || r.state === "RENEWED").length;
  const trial = rows.filter((r) => r.state === "TRIAL").length;
  const lapsed = rows.filter((r) => r.state === "LAPSED").length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.subscriptions.eyebrow", undefined, "Membership")}
        title={t("console.subscriptions.title", undefined, "Subscriptions")}
        subtitle={t(
          "console.subscriptions.subtitle",
          { total: rows.length, active, trial, lapsed },
          `${rows.length} Total · ${active} Active  · ${trial} trial · ${lapsed} lapsed`,
        )}
        action={
          <Button href="/studio/subscriptions/new">
            {t("console.subscriptions.newAction", undefined, "+ New Subscription")}
          </Button>
        }
      />
      <div className="page-content">
        <DataView<Subscription>
          rows={rows}
          rowHref={(r) => `/studio/subscriptions/${r.id}`}
          columns={[
            {
              key: "label",
              header: t("console.subscriptions.columns.label", undefined, "Label"),
              render: (r) => r.label,
              accessor: (r) => r.label,
            },
            {
              key: "kind",
              header: t("console.subscriptions.columns.kind", undefined, "Kind"),
              render: (r) => <Badge variant="default">{toTitle(r.kind)}</Badge>,
              accessor: (r) => r.kind,
            },
            {
              key: "state",
              header: t("console.subscriptions.columns.state", undefined, "State"),
              render: (r) => <Badge variant={badgeVariantForState(r.state)}>{toTitle(r.state)}</Badge>,
              accessor: (r) => r.state,
            },
            {
              key: "cadence",
              header: t("console.subscriptions.columns.cadence", undefined, "Cadence"),
              render: (r) => (r.renewal_cadence_months ? `${r.renewal_cadence_months}mo` : "—"),
              mono: true,
              accessor: (r) => r.renewal_cadence_months ?? null,
            },
            {
              key: "started",
              header: t("console.subscriptions.columns.started", undefined, "Started"),
              render: (r) => (r.started_at ? timeAgo(r.started_at) : "—"),
              className: "text-xs text-[var(--p-text-2)]",
              accessor: (r) => r.started_at,
            },
          ]}
          emptyLabel={t("console.subscriptions.emptyLabel", undefined, "No Subscriptions Yet")}
          emptyDescription={t(
            "console.subscriptions.emptyDescription",
            undefined,
            "Track recurring relationships (members, retainers, and recurring sponsors) with billing state that advances automatically from Stripe.",
          )}
          emptyAction={
            <Button href="/studio/subscriptions/new" size="sm">
              {t("console.subscriptions.createFirst", undefined, "New Subscription")}
            </Button>
          }
        />
      </div>
    </>
  );
}

function badgeVariantForState(state: Subscription["state"]): "default" | "success" | "warning" | "error" | "muted" {
  switch (state) {
    case "ACTIVE":
    case "RENEWED":
    case "REACTIVATED":
      return "success";
    case "TRIAL":
    case "PROSPECT":
      return "default";
    case "LAPSED":
      return "warning";
    case "CHURNED":
      return "error";
    case "ARCHIVED":
      return "muted";
    default:
      return "default";
  }
}
