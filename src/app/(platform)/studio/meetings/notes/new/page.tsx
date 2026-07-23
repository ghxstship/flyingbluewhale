import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestT } from "@/lib/i18n/request";
import { createNote } from "../actions";

export const dynamic = "force-dynamic";

const LBL = "text-xs font-medium text-[var(--p-text-2)]";

export default async function Page() {
  if (!hasSupabase) return null;
  const { t } = await getRequestT();
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { data: meetings } = await supabase
    .from("events")
    .select("id, title:name")
    .eq("org_id", session.orgId)
    .eq("event_kind", "meeting")
    .order("starts_at", { ascending: false })
    .limit(200);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.meetings.notes.new.eyebrow", undefined, "Operations · Run")}
        title={t("console.meetings.notes.new.title", undefined, "New Meeting Note")}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createNote}
          cancelHref="/studio/meetings/notes"
          submitLabel={t("console.meetings.notes.new.submit", undefined, "Create Note")}
        >
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              {t("console.meetings.notes.new.fields.title", undefined, "Title")}
              <span className="ms-0.5 text-[var(--p-danger)]">*</span>
            </span>
            <input
              name="title"
              required
              placeholder={t("console.meetings.notes.new.placeholders.title", undefined, "Production sync · June 14")}
              className="ps-input focus-ring w-full"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              {t("console.meetings.notes.new.fields.linkedMeeting", undefined, "Linked meeting (optional)")}
            </span>
            <select name="meeting_id" className="ps-input focus-ring w-full" defaultValue="">
              <option value="">
                {t("console.meetings.notes.new.standaloneNote", undefined, "standalone note")}
              </option>
              {((meetings ?? []) as Array<{ id: string; title: string }>).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>{t("console.meetings.notes.new.fields.transcript", undefined, "Transcript")}</span>
            <textarea
              name="transcript"
              rows={12}
              placeholder={t(
                "console.meetings.notes.new.placeholders.transcript",
                undefined,
                "Paste the meeting transcript here. You can also create the note empty and paste later, then run Summarize on the detail page.",
              )}
              className="ps-input focus-ring w-full font-mono text-xs"
            />
          </label>
          <p className="text-[11px] text-[var(--p-text-2)]">
            {t(
              "console.meetings.notes.new.transcriptNote",
              undefined,
              "Transcript is text only today. Live audio capture and speech-to-text are a planned future enhancement. After creating, open the note and run Summarize to generate an AI recap and extract action items.",
            )}
          </p>
        </FormShell>
      </div>
    </>
  );
}
