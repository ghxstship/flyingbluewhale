import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { toneFor } from "@/lib/tones";

export const dynamic = "force-dynamic";

type MeetingKind =
  | "kickoff"
  | "owner_architect_contractor"
  | "sub_meeting"
  | "safety"
  | "punch_walk"
  | "design_review"
  | "progress"
  | "other";
type MeetingState = "scheduled" | "in_progress" | "completed" | "cancelled";

type Row = {
  id: string;
  code: string;
  title: string;
  kind: MeetingKind;
  meeting_state: MeetingState;
  starts_at: string;
  ends_at: string | null;
  location_name: string | null;
  finalized_at: string | null;
  project: { name: string | null } | null;
  attendee_count: number;
  open_action_count: number;
};

const KIND_LABEL: Record<MeetingKind, string> = {
  kickoff: "Kickoff",
  owner_architect_contractor: "OAC",
  sub_meeting: "Sub Meeting",
  safety: "Safety",
  punch_walk: "Punch Walk",
  design_review: "Design Review",
  progress: "Progress",
  other: "Other",
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.meetings.eyebrow", undefined, "Coordination")}
          title={t("console.meetings.title", undefined, "Meetings")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.meetings.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();
  const KIND_LABEL_I18N: Record<MeetingKind, string> = {
    kickoff: t("console.meetings.kind.kickoff", undefined, "Kickoff"),
    owner_architect_contractor: t("console.meetings.kind.oac", undefined, "OAC"),
    sub_meeting: t("console.meetings.kind.subMeeting", undefined, "Sub Meeting"),
    safety: t("console.meetings.kind.safety", undefined, "Safety"),
    punch_walk: t("console.meetings.kind.punchWalk", undefined, "Punch Walk"),
    design_review: t("console.meetings.kind.designReview", undefined, "Design Review"),
    progress: t("console.meetings.kind.progress", undefined, "Progress"),
    other: t("console.meetings.kind.other", undefined, "Other"),
  };
  void KIND_LABEL;

  const { data } = await supabase
    .from("meetings")
    .select(
      "id, code, title, kind, meeting_state, starts_at, ends_at, location_name, finalized_at, project:project_id(name)",
    )
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("starts_at", { ascending: false })
    .limit(300);

  const headers = (data ?? []) as unknown as Omit<Row, "attendee_count" | "open_action_count">[];
  const ids = headers.map((h) => h.id);

  const attendeeCounts: Record<string, number> = {};
  const actionCounts: Record<string, number> = {};
  if (ids.length > 0) {
    const [{ data: attendees }, { data: actions }] = await Promise.all([
      supabase.from("meeting_attendees").select("meeting_id").in("meeting_id", ids),
      supabase.from("meeting_action_items").select("meeting_id, action_state").in("meeting_id", ids),
    ]);
    for (const a of (attendees ?? []) as { meeting_id: string }[]) {
      attendeeCounts[a.meeting_id] = (attendeeCounts[a.meeting_id] ?? 0) + 1;
    }
    for (const a of (actions ?? []) as { meeting_id: string; action_state: string }[]) {
      if (a.action_state === "open" || a.action_state === "in_progress") {
        actionCounts[a.meeting_id] = (actionCounts[a.meeting_id] ?? 0) + 1;
      }
    }
  }

  const rows: Row[] = headers.map((h) => ({
    ...h,
    attendee_count: attendeeCounts[h.id] ?? 0,
    open_action_count: actionCounts[h.id] ?? 0,
  }));

  const upcomingCount = rows.filter((r) => r.meeting_state === "scheduled" || r.meeting_state === "in_progress").length;
  const totalOpenActions = rows.reduce((s, r) => s + r.open_action_count, 0);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.meetings.eyebrow", undefined, "Coordination")}
        title={t("console.meetings.title", undefined, "Meetings")}
        subtitle={`${rows.length} ${rows.length === 1 ? t("console.meetings.subtitle.meeting", undefined, "meeting") : t("console.meetings.subtitle.meetings", undefined, "meetings")} · ${upcomingCount} ${t("console.meetings.subtitle.upcoming", undefined, "upcoming")} · ${totalOpenActions} ${totalOpenActions === 1 ? t("console.meetings.subtitle.openActionItem", undefined, "open action item") : t("console.meetings.subtitle.openActionItems", undefined, "open action items")}`}
        action={
          <Button href="/studio/meetings/new" size="sm">
            {t("console.meetings.newMeeting", undefined, "+ New Meeting")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.meetings.metrics.upcoming", undefined, "Upcoming")}
            value={fmt.number(upcomingCount)}
            accent
          />
          <MetricCard
            label={t("console.meetings.metrics.openActions", undefined, "Open Actions")}
            value={fmt.number(totalOpenActions)}
          />
          <MetricCard label={t("console.meetings.metrics.total", undefined, "Total")} value={fmt.number(rows.length)} />
        </div>
        <div className="text-[10px] text-[var(--p-text-2)]">
          {t(
            "console.meetings.description",
            undefined,
            "Project meetings with minutes. Action items added to a meeting auto-create a task for the assignee — closure is bidirectional via meeting_action_items.task_id.",
          )}
        </div>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/studio/meetings/${r.id}`}
          emptyLabel={t("console.meetings.empty.label", undefined, "No meetings yet")}
          emptyDescription={t(
            "console.meetings.empty.description",
            undefined,
            "Schedule a meeting to capture agenda + minutes + action items in one place.",
          )}
          emptyAction={
            <Button href="/studio/meetings/new" size="sm">
              {t("console.meetings.newMeeting", undefined, "+ New Meeting")}
            </Button>
          }
          columns={[
            {
              key: "code",
              header: t("console.meetings.columns.code", undefined, "Code"),
              render: (r) => r.code,
              accessor: (r) => r.code,
              className: "font-mono text-xs",
            },
            {
              key: "title",
              header: t("console.meetings.columns.title", undefined, "Title"),
              render: (r) => r.title,
              accessor: (r) => r.title,
            },
            {
              key: "kind",
              header: t("console.meetings.columns.kind", undefined, "Kind"),
              render: (r) => KIND_LABEL_I18N[r.kind],
              accessor: (r) => r.kind,
              filterable: true,
              groupable: true,
              className: "text-xs",
            },
            {
              key: "project",
              header: t("console.meetings.columns.project", undefined, "Project"),
              render: (r) => r.project?.name ?? "—",
              accessor: (r) => r.project?.name ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "starts",
              header: t("console.meetings.columns.when", undefined, "When"),
              render: (r) =>
                fmt.dateParts(r.starts_at, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
              accessor: (r) => r.starts_at,
              className: "font-mono text-xs",
            },
            {
              key: "attendees",
              header: t("console.meetings.columns.people", undefined, "People"),
              render: (r) => fmt.number(r.attendee_count),
              accessor: (r) => r.attendee_count,
              className: "font-mono text-xs text-right",
            },
            {
              key: "actions",
              header: t("console.meetings.columns.openActs", undefined, "Open Acts"),
              render: (r) =>
                r.open_action_count > 0 ? (
                  <Badge variant="warning">{fmt.number(r.open_action_count)}</Badge>
                ) : (
                  <span className="text-[var(--p-text-2)]">{fmt.number(r.open_action_count)}</span>
                ),
              accessor: (r) => r.open_action_count,
              className: "font-mono text-xs text-right",
            },
            {
              key: "state",
              header: t("console.meetings.columns.state", undefined, "State"),
              render: (r) => (
                <Badge variant={toneFor(r.meeting_state)}>{toTitle(r.meeting_state.replace(/_/g, " "))}</Badge>
              ),
              accessor: (r) => r.meeting_state,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
