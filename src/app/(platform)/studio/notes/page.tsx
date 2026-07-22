import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataView } from "@/components/views/DataViewServer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { createNoteAction } from "./actions";

export const dynamic = "force-dynamic";

type NoteRow = {
  id: string;
  title: string;
  note_state: string;
  updated_at: string;
};

/**
 * /studio/notes — rich-text notes hub (kit v7 RichTextEditor archetype).
 * List + "New Note" (creates a blank note, then opens the editor at
 * /studio/notes/[id]). Backed by the `notes` table (migration
 * 20260623130000_notes) — apply it, then regenerate the typed client.
 */
export default async function NotesPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Collaborate" title={t("console.notes.title", undefined, "Notes")} />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { data } = await supabase
    .from("notes")
    .select("id, title, note_state, updated_at")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(500);
  const rows = (data ?? []) as NoteRow[];

  const newNote = (
    <form action={createNoteAction}>
      <Button type="submit">{t("console.notes.newNote", undefined, "+ New Note")}</Button>
    </form>
  );

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.notes.eyebrow", undefined, "Collaborate")}
        title={t("console.notes.title", undefined, "Notes")}
        subtitle={rows.length === 1 ? "1 note" : `${rows.length} notes`}
        breadcrumbs={[{ label: "Collaborate" }, { label: "Notes" }]}
        action={newNote}
      />
      <div className="page-content">
        {rows.length === 0 ? (
          <EmptyState
            title={t("console.notes.emptyTitle", undefined, "No notes yet")}
            description={t(
              "console.notes.emptyDescription",
              undefined,
              "Capture meeting notes, briefs, and references with a rich-text editor.",
            )}
            action={newNote}
          />
        ) : (
          <DataView<NoteRow>
            rows={rows}
            rowHref={(r) => `/studio/notes/${r.id}`}
            columns={[
              {
                key: "title",
                header: t("console.notes.col.title", undefined, "Title"),
                render: (r) => r.title,
                accessor: (r) => r.title,
              },
              {
                key: "state",
                header: t("console.notes.col.state", undefined, "State"),
                render: (r) => <StatusBadge status={r.note_state} />,
                accessor: (r) => r.note_state,
                filterable: true,
              },
              {
                key: "updated",
                header: t("console.notes.col.updated", undefined, "Updated"),
                render: (r) => timeAgo(r.updated_at),
                accessor: (r) => r.updated_at,
              },
            ]}
          />
        )}
      </div>
    </>
  );
}
