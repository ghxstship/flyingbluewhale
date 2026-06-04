import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { createEntry } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const { t } = await getRequestT();
  const delegations = (await listOrgScoped("delegations", session.orgId, {
    orderBy: "name",
    ascending: true,
    limit: 500,
  })) as Array<{ id: string; name: string; code: string | null }>;

  if (delegations.length === 0) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.participants.entries.eyebrow", undefined, "Participants · Entries")}
          title={t("console.participants.entries.new.title", undefined, "New Entry")}
        />
        <div className="page-content max-w-xl">
          <div className="surface space-y-3 p-6 text-sm">
            <p>
              {t(
                "console.participants.entries.new.needDelegation",
                undefined,
                "You need at least one delegation before you can add an entry.",
              )}
            </p>
            <Button href="/console/participants/delegations/new" size="sm">
              {t("console.participants.entries.new.createDelegation", undefined, "+ Create delegation")}
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.participants.entries.eyebrow", undefined, "Participants · Entries")}
        title={t("console.participants.entries.new.title", undefined, "New Entry")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createEntry}
          cancelHref="/console/participants/entries"
          submitLabel={t("console.participants.entries.new.submit", undefined, "Add Entry")}
        >
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              {t("console.participants.entries.new.delegationLabel", undefined, "Delegation")}
            </label>
            <select name="delegation_id" className="input-base mt-1.5 w-full" required>
              {delegations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code ? `${d.code} — ${d.name}` : d.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label={t("console.participants.entries.new.participantNameLabel", undefined, "Participant Name")}
            name="participant_name"
            maxLength={200}
            required
          />
          <Input
            label={t("console.participants.entries.new.disciplineLabel", undefined, "Discipline")}
            name="discipline"
            maxLength={120}
            placeholder={t(
              "console.participants.entries.new.disciplinePlaceholder",
              undefined,
              "e.g. Athletics, Swimming",
            )}
          />
          <Input
            label={t("console.participants.entries.new.eventLabel", undefined, "Event")}
            name="event"
            maxLength={120}
            placeholder={t("console.participants.entries.new.eventPlaceholder", undefined, "e.g. 100m freestyle")}
          />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              {t("console.participants.entries.new.statusLabel", undefined, "Status")}
            </label>
            <select name="status" defaultValue="nominated" className="input-base mt-1.5 w-full">
              <option value="nominated">
                {t("console.participants.entries.new.statusNominated", undefined, "Nominated")}
              </option>
              <option value="confirmed">
                {t("console.participants.entries.new.statusConfirmed", undefined, "Confirmed")}
              </option>
              <option value="on_site">
                {t("console.participants.entries.new.statusOnSite", undefined, "On site")}
              </option>
              <option value="withdrawn">
                {t("console.participants.entries.new.statusWithdrawn", undefined, "Withdrawn")}
              </option>
            </select>
          </div>
        </FormShell>
      </div>
    </>
  );
}
