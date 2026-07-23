import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { getRequestT } from "@/lib/i18n/request";
import { createGuestListAction } from "../actions";

export const dynamic = "force-dynamic";

type EventRow = { id: string; name: string };

export default async function NewGuestListPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title={t("console.boxOffice.new.title", undefined, "New Guest List")} />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data: eventData } = await supabase
    .from("events")
    .select("id, name")
    .eq("org_id", session.orgId)
    .order("starts_at", { ascending: false })
    .limit(200);
  const events = (eventData ?? []) as unknown as EventRow[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.boxOffice.new.eyebrow", undefined, "Box Office")}
        title={t("console.boxOffice.new.title", undefined, "New Guest List")}
        subtitle={t(
          "console.boxOffice.new.subtitle",
          undefined,
          "Name the list and tie it to an event. Add guests on the next screen.",
        )}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createGuestListAction}
          cancelHref="/studio/marketplace/box-office"
          submitLabel={t("console.boxOffice.new.submit", undefined, "Create List")}
        >
          <Input
            label={t("console.boxOffice.new.fields.name", undefined, "List Name")}
            name="name"
            required
            maxLength={160}
            placeholder={t("console.boxOffice.new.placeholders.name", undefined, "VIP · Artist Comps · Press")}
          />
          <div>
            <label htmlFor="event_id" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.boxOffice.new.fields.event", undefined, "Event (Optional)")}
            </label>
            <select id="event_id" name="event_id" className="ps-input mt-1.5 w-full" defaultValue="">
              <option value="">{t("console.boxOffice.new.event.none", undefined, "No event")}</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="notes" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.boxOffice.new.fields.notes", undefined, "Notes")}
            </label>
            <textarea id="notes" name="notes" rows={4} maxLength={2000} className="ps-input mt-1.5 w-full" />
          </div>
        </FormShell>
      </div>
    </>
  );
}
