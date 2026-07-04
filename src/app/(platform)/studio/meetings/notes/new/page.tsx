import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { createNote } from "../actions";

export const dynamic = "force-dynamic";

const LBL = "text-xs font-medium text-[var(--p-text-2)]";

export default async function Page() {
  if (!hasSupabase) return null;
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
      <ModuleHeader eyebrow="Coordination" title="New Meeting Note" />
      <div className="page-content max-w-2xl">
        <FormShell action={createNote} cancelHref="/studio/meetings/notes" submitLabel="Create Note">
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              Title
              <span className="ms-0.5 text-[var(--p-danger)]">*</span>
            </span>
            <input
              name="title"
              required
              placeholder="Production sync — June 14"
              className="ps-input focus-ring w-full"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>Linked meeting (optional)</span>
            <select name="meeting_id" className="ps-input focus-ring w-full" defaultValue="">
              <option value="">— standalone note —</option>
              {((meetings ?? []) as Array<{ id: string; title: string }>).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>Transcript</span>
            <textarea
              name="transcript"
              rows={12}
              placeholder="Paste the meeting transcript here. You can also create the note empty and paste later, then run Summarize on the detail page."
              className="ps-input focus-ring w-full font-mono text-xs"
            />
          </label>
          <p className="text-[10px] text-[var(--p-text-2)]">
            Transcript is text only today — live audio capture and speech-to-text are a planned future enhancement.
            After creating, open the note and run Summarize to generate an AI recap and extract action items.
          </p>
        </FormShell>
      </div>
    </>
  );
}
