import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { notifyWaitlistEntry } from "./actions";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  item: string;
  position: number;
  party: string;
  email: string | null;
  joinedAt: string;
  notifiedAt: string | null;
};

/**
 * /studio/projects/[projectId]/advancing/waitlist — admin waitlist management.
 * View, sort, and mark-notified per ticket-type queue (Eventbrite / Tixr parity).
 */
export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.advancing.waitlist.eyebrow", undefined, "Advancing")}
          title={t("console.advancing.waitlist.title", undefined, "Waitlist")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.advancing.waitlist.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }

  const { projectId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  // Verify project belongs to org.
  const { data: proj } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!proj) notFound();
  const project = proj as { id: string; name: string | null };

  // Catalog items (tickets only) for this project's org.
  const { data: items } = await supabase
    .from("master_catalog_items")
    .select("id, name")
    .eq("org_id", session.orgId)
    .eq("kind", "ticket")
    .is("deleted_at", null);
  const itemMap = new Map(
    ((items ?? []) as Array<{ id: string; name: string }>).map((i) => [i.id, i.name]),
  );

  // All waitlist entries for items in this org.
  const itemIds = Array.from(itemMap.keys());
  const waitlistRows: Row[] = [];

  if (itemIds.length) {
    const { data: entries } = await supabase
      .from("catalog_waitlist")
      .select("id, catalog_item_id, party_user_id, party_email, party_name, position, joined_at, notified_at")
      .eq("org_id", session.orgId)
      .in("catalog_item_id", itemIds)
      .order("catalog_item_id")
      .order("position", { ascending: true });

    const rawEntries = (entries ?? []) as Array<{
      id: string;
      catalog_item_id: string;
      party_user_id: string | null;
      party_email: string | null;
      party_name: string | null;
      position: number;
      joined_at: string;
      notified_at: string | null;
    }>;

    const userIds = Array.from(new Set(rawEntries.map((e) => e.party_user_id).filter(Boolean) as string[]));
    const userMap = new Map<string, string>();
    if (userIds.length) {
      const { data: users } = await supabase.from("users").select("id, name, email").in("id", userIds);
      for (const u of (users ?? []) as Array<{ id: string; name: string | null; email: string | null }>) {
        userMap.set(u.id, u.name ?? u.email ?? "—");
      }
    }

    for (const e of rawEntries) {
      const userName = e.party_user_id ? (userMap.get(e.party_user_id) ?? "—") : null;
      waitlistRows.push({
        id: e.id,
        item: itemMap.get(e.catalog_item_id) ?? "—",
        position: e.position,
        party: e.party_name ?? userName ?? e.party_email ?? "—",
        email: e.party_email ?? null,
        joinedAt: `${fmt.date(e.joined_at)} · ${fmt.time(e.joined_at)}`,
        notifiedAt: e.notified_at ? `${fmt.date(e.notified_at)} · ${fmt.time(e.notified_at)}` : null,
      });
    }
  }

  const total = waitlistRows.length;
  const notified = waitlistRows.filter((r) => r.notifiedAt !== null).length;
  const pending = total - notified;

  return (
    <>
      <ModuleHeader
        eyebrow={project.name ?? t("console.advancing.waitlist.eyebrow", undefined, "Advancing")}
        title={t("console.advancing.waitlist.title", undefined, "Waitlist")}
        subtitle={t(
          "console.advancing.waitlist.subtitle",
          { total, pending, notified },
          `${total} total · ${pending} pending notification · ${notified} notified`,
        )}
        actions={
          <Link
            href={`/studio/projects/${projectId}/advancing/assignments`}
            className="ps-btn ps-btn--ghost"
            style={{ fontSize: 13 }}
          >
            {t("console.advancing.waitlist.back", undefined, "← Assignments")}
          </Link>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label={t("console.advancing.waitlist.metric.total", undefined, "On Waitlist")} value={String(total)} />
          <MetricCard
            label={t("console.advancing.waitlist.metric.pending", undefined, "Pending Notification")}
            value={String(pending)}
            accent={pending > 0}
          />
          <MetricCard label={t("console.advancing.waitlist.metric.notified", undefined, "Notified")} value={String(notified)} />
        </div>

        {waitlistRows.length === 0 ? (
          <EmptyState
            title={t("console.advancing.waitlist.empty.title", undefined, "No waitlist entries")}
            description={t(
              "console.advancing.waitlist.empty.body",
              undefined,
              "When guests join the waitlist for a sold-out ticket type, entries appear here.",
            )}
          />
        ) : (
          <DataTable<Row>
            tableId="advancing.waitlist"
            rows={waitlistRows}
            emptyLabel={t("console.advancing.waitlist.empty.title", undefined, "No waitlist entries")}
            columns={[
              {
                key: "item",
                header: t("console.advancing.waitlist.col.item", undefined, "Ticket Type"),
                render: (r) => r.item,
                accessor: (r) => r.item,
                filterable: true,
                groupable: true,
              },
              {
                key: "position",
                header: t("console.advancing.waitlist.col.position", undefined, "#"),
                render: (r) => <span className="font-mono text-xs">{r.position}</span>,
                accessor: (r) => r.position,
              },
              {
                key: "party",
                header: t("console.advancing.waitlist.col.party", undefined, "Guest"),
                render: (r) => (
                  <div>
                    <div>{r.party}</div>
                    {r.email && (
                      <div className="text-xs text-[var(--p-text-3)]">{r.email}</div>
                    )}
                  </div>
                ),
                accessor: (r) => r.party,
                filterable: true,
              },
              {
                key: "joinedAt",
                header: t("console.advancing.waitlist.col.joined", undefined, "Joined"),
                render: (r) => <span className="font-mono text-xs">{r.joinedAt}</span>,
                accessor: (r) => r.joinedAt,
              },
              {
                key: "status",
                header: t("console.advancing.waitlist.col.status", undefined, "Status"),
                render: (r) =>
                  r.notifiedAt ? (
                    <Badge variant="ok">
                      {t("console.advancing.waitlist.status.notified", undefined, "Notified")}
                    </Badge>
                  ) : (
                    <Badge variant="neutral">
                      {t("console.advancing.waitlist.status.waiting", undefined, "Waiting")}
                    </Badge>
                  ),
                accessor: (r) => (r.notifiedAt ? "notified" : "waiting"),
                filterable: true,
                groupable: true,
              },
              {
                key: "action",
                header: t("console.advancing.waitlist.col.action", undefined, "Action"),
                render: (r) =>
                  !r.notifiedAt ? (
                    <form action={notifyWaitlistEntry}>
                      <input type="hidden" name="entry_id" value={r.id} />
                      <input type="hidden" name="project_id" value={projectId} />
                      <button type="submit" className="ps-btn btn-xs">
                        {t("console.advancing.waitlist.action.notify", undefined, "Mark Notified")}
                      </button>
                    </form>
                  ) : (
                    <span className="text-xs text-[var(--p-text-3)]">{r.notifiedAt}</span>
                  ),
                accessor: () => null,
              },
            ]}
          />
        )}
      </div>
    </>
  );
}
