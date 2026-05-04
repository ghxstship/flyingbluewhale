import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { listAnnotations, type Annotation } from "@/lib/db/annotations";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

const SEVERITY_VARIANT: Record<Annotation["severity"], "muted" | "warning" | "error"> = {
  info: "muted",
  warning: "warning",
  critical: "error",
};

export default async function AnnotationsPage() {
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title="Annotations" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );

  const session = await requireSession();
  const rows = await listAnnotations({
    orgId: session.orgId,
    parentId: null,
    status: ["open", "acknowledged"],
  });
  const open = rows.filter((r) => r.status === "open").length;
  const critical = rows.filter((r) => r.severity === "critical").length;

  return (
    <>
      <ModuleHeader
        eyebrow="Run"
        title="Annotations"
        subtitle={`${open} open · ${critical} critical · ${rows.length - open} acknowledged`}
      />
      <div className="page-content">
        <DataTable<Annotation>
          rows={rows}
          rowHref={(r) => `/console/annotations/${r.id}`}
          columns={[
            {
              key: "severity",
              header: "Severity",
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
              header: "Kind",
              render: (r) => <span className="font-mono text-xs uppercase">{r.kind}</span>,
              accessor: (r) => r.kind,
              filterable: true,
              groupable: true,
            },
            {
              key: "title",
              header: "Title",
              render: (r) => (
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{r.title ?? r.body.slice(0, 80)}</span>
                  {r.tags.length > 0 ? (
                    <span className="text-xs text-(--ink-soft)">{r.tags.map((t) => `#${t}`).join(" ")}</span>
                  ) : null}
                </div>
              ),
              accessor: (r) => r.title ?? r.body,
            },
            {
              key: "target",
              header: "Target",
              render: (r) => (
                <span className="font-mono text-xs">
                  {r.target_table}/{r.target_id.slice(0, 8)}
                </span>
              ),
              accessor: (r) => r.target_table,
              filterable: true,
              groupable: true,
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <StatusBadge status={r.status} />,
              accessor: (r) => r.status,
              filterable: true,
              groupable: true,
            },
            {
              key: "due",
              header: "Due",
              render: (r) => (r.due_at ? formatDate(r.due_at, "medium") : "—"),
              className: "font-mono text-xs",
              accessor: (r) => r.due_at,
            },
            {
              key: "confirm",
              header: "Confirm",
              render: (r) =>
                r.confirmation_required ? (
                  r.confirmed_at ? (
                    <Badge variant="success">Confirmed</Badge>
                  ) : (
                    <Badge variant="warning">Needed</Badge>
                  )
                ) : (
                  <span className="text-(--ink-soft)">—</span>
                ),
              accessor: (r) => (r.confirmation_required ? (r.confirmed_at ? 2 : 1) : 0),
            },
            {
              key: "created",
              header: "Created",
              render: (r) => timeAgo(r.created_at),
              className: "font-mono text-xs",
              accessor: (r) => r.created_at,
            },
          ]}
        />

        {rows.length === 0 ? (
          <div className="surface mt-6 p-6 text-sm text-(--ink-soft)">
            No open annotations. Use <code className="font-mono">createAnnotation()</code> from{" "}
            <code className="font-mono">@/lib/db/annotations</code> or the helper SQL function{" "}
            <code className="font-mono">create_annotation()</code> to flag records for follow-up.
          </div>
        ) : null}

        <div className="surface mt-6 p-4 text-xs text-(--ink-soft)">
          Annotations are polymorphic across all entity types. They auto-fire notifications to assignees and watchers,
          and append to the audit log. Use <span className="font-mono">kind=flag</span> for items requiring action,{" "}
          <span className="font-mono">kind=note</span> for context,
          <span className="font-mono">kind=comment</span> for replies, and <span className="font-mono">kind=tag</span>{" "}
          for label-only entries.{" "}
          <Link className="underline" href="/console/tasks">
            Tasks
          </Link>{" "}
          remain the canonical primitive for actionable work with deadlines.
        </div>
      </div>
    </>
  );
}
