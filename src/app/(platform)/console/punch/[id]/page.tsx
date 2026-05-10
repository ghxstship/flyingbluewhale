import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConversationPanel } from "@/components/ConversationPanel";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { transitionPunchItem } from "./actions";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, "muted" | "info" | "warning" | "success" | "error"> = {
  open: "warning",
  in_progress: "info",
  ready_for_review: "info",
  complete: "success",
  void: "muted",
};

function fmt(d: string | null): string {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString();
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("punch_items")
    .select("*, project:project_id(name), assignee:assignee_id(name, email), vendor:vendor_id(name)")
    .eq("org_id", session.orgId)
    .eq("id", id)
    .maybeSingle();
  if (!item) notFound();

  const project = (item.project as unknown as { name: string | null } | null)?.name ?? "—";
  const assignee = item.assignee as unknown as { name: string | null; email: string | null } | null;
  const vendor = (item.vendor as unknown as { name: string | null } | null)?.name ?? null;

  return (
    <>
      <ModuleHeader
        eyebrow="Operations"
        breadcrumbs={[{ label: "Punch List", href: "/console/punch" }, { label: item.code }]}
        title={`${item.code} — ${item.title}`}
        subtitle={project}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_TONE[item.status] ?? "muted"}>{item.status.replace("_", " ")}</Badge>
            {item.show_ready_gate && <Badge variant="error">Doors Gate</Badge>}
            <a
              href={`/console/punch/${item.id}/edit`}
              className="surface hover-lift rounded-md px-3 py-1.5 text-xs font-medium"
            >
              Edit
            </a>
            {item.status === "open" && (
              <form action={transitionPunchItem.bind(null, id, "in_progress")}>
                <Button type="submit" variant="secondary" size="sm">
                  Start
                </Button>
              </form>
            )}
            {item.status === "in_progress" && (
              <form action={transitionPunchItem.bind(null, id, "ready_for_review")}>
                <Button type="submit" variant="secondary" size="sm">
                  Mark ready
                </Button>
              </form>
            )}
            {item.status === "ready_for_review" && (
              <form action={transitionPunchItem.bind(null, id, "complete")}>
                <Button type="submit" variant="secondary" size="sm">
                  Close
                </Button>
              </form>
            )}
          </div>
        }
      />
      <div className="page-content space-y-5">
        <section className="surface p-4">
          <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <dt className="text-xs text-[var(--text-muted)]">Priority</dt>
              <dd className="font-medium">{item.priority}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--text-muted)]">Due</dt>
              <dd className="font-mono">{fmt(item.due_at)}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--text-muted)]">Assignee</dt>
              <dd>{assignee?.name ?? assignee?.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--text-muted)]">Vendor</dt>
              <dd>{vendor ?? "—"}</dd>
            </div>
          </dl>
          {item.description && <p className="mt-4 text-sm whitespace-pre-wrap">{item.description}</p>}
        </section>
        <ConversationPanel orgId={session.orgId} recordType="punch_item" recordId={id} />
      </div>
    </>
  );
}
