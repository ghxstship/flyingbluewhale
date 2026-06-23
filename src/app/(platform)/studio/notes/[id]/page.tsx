import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { DeleteForm } from "@/components/DeleteForm";
import { NoteEditor } from "./NoteEditor";
import { deleteNoteAction } from "../actions";

export const dynamic = "force-dynamic";

type Note = {
  id: string;
  title: string;
  body_html: string;
  note_state: string;
};

export default async function NoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { data } = await supabase
    .from("notes")
    .select("id, title, body_html, note_state")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  const note = data as Note | null;
  if (!note) notFound();
  const { t } = await getRequestT();

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.notes.eyebrow", undefined, "Collaborate")}
        title={note.title}
        breadcrumbs={[{ label: "Notes", href: "/studio/notes" }, { label: note.title }]}
        action={
          <DeleteForm
            action={deleteNoteAction.bind(null, note.id)}
            label={t("console.notes.delete", undefined, "Delete")}
            confirm={t("console.notes.deleteConfirm", undefined, "Delete this note?")}
          />
        }
      />
      <div className="page-content">
        <NoteEditor
          id={note.id}
          title={note.title}
          bodyHtml={note.body_html}
          noteState={note.note_state}
          labels={{
            titleLabel: t("console.notes.titleLabel", undefined, "Title"),
            titlePlaceholder: t("console.notes.titlePlaceholder", undefined, "Untitled note"),
            stateLabel: t("console.notes.stateLabel", undefined, "State"),
            stateDraft: t("console.notes.stateDraft", undefined, "Draft"),
            statePublished: t("console.notes.statePublished", undefined, "Published"),
            stateArchived: t("console.notes.stateArchived", undefined, "Archived"),
            save: t("console.notes.save", undefined, "Save note"),
            saving: t("console.notes.saving", undefined, "Saving…"),
            saved: t("console.notes.saved", undefined, "Saved"),
            error: t("console.notes.error", undefined, "Could not save"),
          }}
        />
      </div>
    </>
  );
}
