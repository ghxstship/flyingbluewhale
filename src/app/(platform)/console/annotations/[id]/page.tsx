import { notFound } from "next/navigation";
import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { listAnnotations, type Annotation } from "@/lib/db/annotations";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";
import { timeAgo } from "@/lib/format";
import { AnnotationActions, ReplyForm } from "../AnnotationActions";

export const dynamic = "force-dynamic";

const SEVERITY_VARIANT: Record<Annotation["severity"], "muted" | "warning" | "error"> = {
  info: "muted",
  warning: "warning",
  critical: "error",
};

export default async function AnnotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabase) return notFound();
  const { id } = await params;
  const session = await requireSession();

  const all = await listAnnotations({ orgId: session.orgId });
  const root = all.find((a) => a.id === id && a.parent_id === null);
  if (!root) notFound();
  const replies = all.filter((a) => a.parent_id === root.id).sort((a, b) => a.created_at.localeCompare(b.created_at));

  return (
    <>
      <ModuleHeader
        eyebrow={root.kind.toUpperCase()}
        title={root.title ?? root.body.slice(0, 80)}
        subtitle={`${root.severity} · ${root.status}${root.due_at ? ` · due ${formatDate(root.due_at, "medium")}` : ""}`}
        action={
          <AnnotationActions
            id={root.id}
            status={root.status}
            confirmationRequired={root.confirmation_required}
            confirmedAt={root.confirmed_at}
          />
        }
      />
      <div className="page-content space-y-6">
        <div className="metric-grid">
          <Field label="Severity">
            <Badge variant={SEVERITY_VARIANT[root.severity]} className="uppercase">
              {root.severity}
            </Badge>
          </Field>
          <Field label="Status">
            <StatusBadge status={root.status} />
          </Field>
          <Field label="Target">
            <span className="font-mono text-xs">
              {root.target_table}/{root.target_id.slice(0, 8)}
            </span>
          </Field>
          <Field label="Confirmation">
            {root.confirmation_required ? (
              root.confirmed_at ? (
                <Badge variant="success">Confirmed</Badge>
              ) : (
                <Badge variant="warning">Required</Badge>
              )
            ) : (
              <span className="text-[var(--text-subtle)]">—</span>
            )}
          </Field>
        </div>

        <div className="surface p-5">
          <h3 className="text-sm font-semibold">Body</h3>
          <p className="mt-2 text-sm whitespace-pre-wrap text-[var(--text-secondary)]">{root.body}</p>
          {root.tags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {root.tags.map((t) => (
                <span key={t} className="rounded-md bg-(--surface-inset) px-2 py-0.5 font-mono text-xs">
                  #{t}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {root.resolution_note ? (
          <div className="surface p-5">
            <h3 className="text-sm font-semibold">Resolution note</h3>
            <p className="mt-2 text-sm whitespace-pre-wrap text-[var(--text-secondary)]">{root.resolution_note}</p>
            {root.resolved_at ? (
              <p className="mt-2 text-xs text-[var(--text-subtle)]">Resolved {timeAgo(root.resolved_at)}</p>
            ) : null}
          </div>
        ) : null}

        {Object.keys(root.metadata).length > 0 ? (
          <div className="surface p-5">
            <h3 className="text-sm font-semibold">Metadata</h3>
            <pre className="mt-2 overflow-x-auto rounded-md bg-(--surface-inset) p-3 font-mono text-xs">
              {JSON.stringify(root.metadata, null, 2)}
            </pre>
          </div>
        ) : null}

        <div className="surface p-5">
          <h3 className="text-sm font-semibold">Replies ({replies.length})</h3>
          <ul className="mt-3 space-y-3">
            {replies.map((r) => (
              <li key={r.id} className="border-s-2 border-(--ink) ps-3 text-sm">
                <p className="whitespace-pre-wrap">{r.body}</p>
                <p className="mt-1 font-mono text-xs text-[var(--text-subtle)]">{timeAgo(r.created_at)}</p>
              </li>
            ))}
            {replies.length === 0 ? <li className="text-sm text-[var(--text-subtle)]">No replies yet.</li> : null}
          </ul>
          <div className="mt-4">
            <ReplyForm parentId={root.id} />
          </div>
        </div>

        <Link href="/console/annotations" className="inline-block text-xs text-[var(--text-subtle)] underline">
          ← Back to all annotations
        </Link>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="surface p-3">
      <div className="text-[11px] font-semibold tracking-wider text-[var(--text-subtle)] uppercase">{label}</div>
      <div className="mt-1 font-mono text-sm">{children}</div>
    </div>
  );
}
