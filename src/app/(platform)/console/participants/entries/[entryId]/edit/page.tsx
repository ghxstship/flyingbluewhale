import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateEntry, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ entryId: string }> }) {
  const { entryId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("delegation_entries", session.orgId, entryId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  const { t } = await getRequestT();
  const action = updateEntry.bind(null, entryId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.participants.entries.edit.eyebrow", undefined, "Participants · Entry")}
        title={t("console.participants.entries.edit.title", undefined, "Edit Entry")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/participants/entries/${entryId}`}
          submitLabel={t("common.saveChanges", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.participants.entries.edit.participantName", undefined, "Participant Name")}
            name="participant_name"
            maxLength={200}
            defaultValue={(r.participant_name as string | undefined) ?? ""}
            required
          />
          <Input
            label={t("console.participants.entries.edit.discipline", undefined, "Discipline")}
            name="discipline"
            maxLength={120}
            defaultValue={(r.discipline as string | undefined) ?? ""}
          />
          <Input
            label={t("console.participants.entries.edit.event", undefined, "Event")}
            name="event"
            maxLength={120}
            defaultValue={(r.event as string | undefined) ?? ""}
          />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              {t("console.participants.entries.edit.status", undefined, "Status")}
            </label>
            <select
              name="status"
              defaultValue={(r.status as string | undefined) ?? "nominated"}
              className="input-base mt-1.5 w-full"
            >
              <option value="nominated">
                {t("console.participants.entries.edit.statusNominated", undefined, "Nominated")}
              </option>
              <option value="confirmed">
                {t("console.participants.entries.edit.statusConfirmed", undefined, "Confirmed")}
              </option>
              <option value="on_site">
                {t("console.participants.entries.edit.statusOnSite", undefined, "On site")}
              </option>
              <option value="withdrawn">
                {t("console.participants.entries.edit.statusWithdrawn", undefined, "Withdrawn")}
              </option>
            </select>
          </div>
        </FormShell>
      </div>
    </>
  );
}
