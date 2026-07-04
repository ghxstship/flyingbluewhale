import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/ui/MetricCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { NOTE_STATE_LABEL, parseActionItems, type NoteState } from "@/lib/meeting-notes";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  title: string;
  note_state: NoteState;
  created_at: string;
  summarized_at: string | null;
  action_item_count: number;
  meeting: { title: string | null } | null;
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Coordination" title="Meeting Notes" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { data } = await supabase
    .from("meeting_notes")
    .select("id, title, note_state, created_at, summarized_at, action_items, meeting:meeting_id(title:name)")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(300);

  const rows: Row[] = ((data ?? []) as Array<Record<string, unknown>>).map((r) => ({
    id: r.id as string,
    title: r.title as string,
    note_state: r.note_state as NoteState,
    created_at: r.created_at as string,
    summarized_at: (r.summarized_at as string | null) ?? null,
    action_item_count: parseActionItems(r.action_items).length,
    meeting: (r.meeting as { title: string | null } | null) ?? null,
  }));

  const summarizedCount = rows.filter((r) => r.note_state === "summarized").length;
  const totalActions = rows.reduce((s, r) => s + r.action_item_count, 0);

  return (
    <>
      <ModuleHeader
        eyebrow="Coordination"
        title="Meeting Notes"
        subtitle="Paste a transcript, generate an AI summary + action items, push them to tasks."
        action={
          <Button href="/studio/meetings/notes/new" size="sm">
            + New Note
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Notes" value={String(rows.length)} accent />
          <MetricCard label="Summarized" value={String(summarizedCount)} />
          <MetricCard label="Action Items" value={String(totalActions)} />
        </div>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/studio/meetings/notes/${r.id}`}
          emptyLabel="No meeting notes yet"
          emptyDescription="Create a note, paste a transcript, and run Summarize to extract a recap and action items."
          emptyAction={
            <Button href="/studio/meetings/notes/new" size="sm">
              + New Note
            </Button>
          }
          columns={[
            {
              key: "title",
              header: "Title",
              render: (r) => r.title,
              accessor: (r) => r.title,
            },
            {
              key: "meeting",
              header: "Meeting",
              render: (r) => r.meeting?.title ?? "—",
              accessor: (r) => r.meeting?.title ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "actions",
              header: "Action Items",
              render: (r) => String(r.action_item_count),
              accessor: (r) => r.action_item_count,
              className: "font-mono text-xs text-right",
            },
            {
              key: "state",
              header: "State",
              render: (r) => <StatusBadge status={r.note_state} />,
              accessor: (r) => NOTE_STATE_LABEL[r.note_state],
              filterable: true,
              groupable: true,
            },
            {
              key: "created",
              header: "Created",
              render: (r) => new Date(r.created_at).toLocaleDateString(),
              accessor: (r) => r.created_at,
              className: "font-mono text-xs",
            },
          ]}
        />
      </div>
    </>
  );
}
