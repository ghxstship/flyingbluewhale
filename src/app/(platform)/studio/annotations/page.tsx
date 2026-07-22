import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { DataView } from "@/components/views/DataViewServer";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { listAnnotations, type Annotation } from "@/lib/db/annotations";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";
import { timeAgo } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

const SEVERITY_VARIANT: Record<Annotation["severity"], "muted" | "warning" | "error"> = {
  info: "muted",
  warning: "warning",
  critical: "error",
};

export default async function AnnotationsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title={t("console.annotations.title", undefined, "Annotations")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.annotations.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );

  const session = await requireSession();
  const rows = await listAnnotations({
    orgId: session.orgId,
    parentId: null,
    annotation_state: ["open", "acknowledged"],
  });
  const open = rows.filter((r) => r.annotation_state === "open").length;
  const critical = rows.filter((r) => r.severity === "critical").length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.annotations.eyebrow", undefined, "Run")}
        title={t("console.annotations.title", undefined, "Annotations")}
        subtitle={t(
          "console.annotations.subtitle",
          { open, critical, acknowledged: rows.length - open },
          `${open} Open  · ${critical} critical · ${rows.length - open} acknowledged`,
        )}
      />
      <div className="page-content">
        <DataView<Annotation>
          rows={rows}
          rowHref={(r) => `/studio/annotations/${r.id}`}
          columns={[
            {
              key: "severity",
              header: t("console.annotations.col.severity", undefined, "Severity"),
              render: (r) => (
                <Badge variant={SEVERITY_VARIANT[r.severity]} className="uppercase">
                  {r.severity}
                </Badge>
              ),
              accessor: (r) => r.severity,
              filterable: true,
              groupable: true,
            },
            {
              key: "kind",
              header: t("console.annotations.col.kind", undefined, "Kind"),
              render: (r) => <span className="uppercase">{r.kind}</span>,
              mono: true,
              accessor: (r) => r.kind,
              filterable: true,
              groupable: true,
            },
            {
              key: "title",
              header: t("console.annotations.col.title", undefined, "Title"),
              render: (r) => (
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{r.title ?? r.body.slice(0, 80)}</span>
                  {r.tags.length > 0 ? (
                    <span className="text-xs text-[var(--p-text-3)]">{r.tags.map((tag) => `#${tag}`).join(" ")}</span>
                  ) : null}
                </div>
              ),
              accessor: (r) => r.title ?? r.body,
            },
            {
              key: "target",
              header: t("console.annotations.col.target", undefined, "Target"),
              render: (r) => (
                <span>
                  {r.target_table}/{r.target_id.slice(0, 8)}
                </span>
              ),
              mono: true,
              accessor: (r) => r.target_table,
              filterable: true,
              groupable: true,
            },
            {
              key: "status",
              header: t("console.annotations.col.annotation_state", undefined, "Status"),
              render: (r) => <StatusBadge status={r.annotation_state} />,
              accessor: (r) => r.annotation_state,
              filterable: true,
              groupable: true,
            },
            {
              key: "due",
              header: t("console.annotations.col.due", undefined, "Due"),
              render: (r) => (r.due_at ? formatDate(r.due_at, "medium") : "—"),
              mono: true,
              accessor: (r) => r.due_at,
            },
            {
              key: "confirm",
              header: t("console.annotations.col.confirm", undefined, "Confirm"),
              render: (r) =>
                r.confirmation_required ? (
                  r.confirmed_at ? (
                    <Badge variant="success">{t("console.annotations.confirmed", undefined, "Confirmed")}</Badge>
                  ) : (
                    <Badge variant="warning">{t("console.annotations.needed", undefined, "Needed")}</Badge>
                  )
                ) : (
                  <span className="text-[var(--p-text-3)]">—</span>
                ),
              accessor: (r) => (r.confirmation_required ? (r.confirmed_at ? 2 : 1) : 0),
            },
            {
              key: "created",
              header: t("console.annotations.col.created", undefined, "Created"),
              render: (r) => timeAgo(r.created_at),
              mono: true,
              accessor: (r) => r.created_at,
            },
          ]}
        />

        {rows.length === 0 ? (
          <div className="surface mt-6 p-6 text-sm text-[var(--p-text-3)]">
            {t("console.annotations.emptyPrefix", undefined, "No open annotations. Use")}{" "}
            <code className="font-mono">createAnnotation()</code>{" "}
            {t("console.annotations.emptyFrom", undefined, "from")}{" "}
            <code className="font-mono">@/lib/db/annotations</code>{" "}
            {t("console.annotations.emptyOrHelper", undefined, "or the helper SQL function")}{" "}
            <code className="font-mono">create_annotation()</code>{" "}
            {t("console.annotations.emptySuffix", undefined, "to flag records for follow-up.")}
          </div>
        ) : null}

        <div className="surface mt-6 p-4 text-xs text-[var(--p-text-3)]">
          {t(
            "console.annotations.infoIntro",
            undefined,
            "Annotations are polymorphic across all entity types. They auto-fire notifications to assignees and watchers, and append to the audit log. Use",
          )}{" "}
          <span className="font-mono">kind=flag</span>{" "}
          {t("console.annotations.infoFlag", undefined, "for items requiring action,")}{" "}
          <span className="font-mono">kind=note</span> {t("console.annotations.infoNote", undefined, "for context,")}
          <span className="font-mono">kind=comment</span>{" "}
          {t("console.annotations.infoComment", undefined, "for replies, and")}{" "}
          <span className="font-mono">kind=tag</span>{" "}
          {t("console.annotations.infoTag", undefined, "for label-only entries.")}{" "}
          <Link className="underline" href="/studio/tasks">
            {t("console.annotations.tasksLink", undefined, "Tasks")}
          </Link>{" "}
          {t(
            "console.annotations.infoOutro",
            undefined,
            "remain the canonical primitive for actionable work with deadlines.",
          )}
        </div>
      </div>
    </>
  );
}
