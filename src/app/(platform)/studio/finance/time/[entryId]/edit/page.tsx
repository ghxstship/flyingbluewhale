import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateTimeEntry, type State } from "./actions";

export const dynamic = "force-dynamic";

function dateTimeLocal(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 16);
}

export default async function Page({ params }: { params: Promise<{ entryId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("time_entries", session.orgId, p.entryId);
  if (!row) notFound();
  const { t } = await getRequestT();
  const action = updateTimeEntry.bind(null, p.entryId) as unknown as (state: State, fd: FormData) => Promise<State>;
  const fallbackDescription = t("console.finance.time.edit.fallbackDescription", undefined, "time entry");
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.time.edit.eyebrow", undefined, "Time Entry")}
        title={t(
          "console.finance.time.edit.title",
          { description: row.description ?? fallbackDescription },
          `Edit ${row.description ?? fallbackDescription}`,
        )}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/studio/finance/time/${p.entryId}`}
          submitLabel={t("common.saveChanges", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.finance.time.edit.fields.description", undefined, "Description")}
            name="description"
            defaultValue={row.description ?? ""}
            maxLength={500}
          />
          <Input
            label={t("console.finance.time.edit.fields.startedAt", undefined, "Started At")}
            name="started_at"
            type="datetime-local"
            defaultValue={dateTimeLocal(row.started_at)}
            required
          />
          <Input
            label={t("console.finance.time.edit.fields.endedAt", undefined, "Ended At")}
            name="ended_at"
            type="datetime-local"
            defaultValue={dateTimeLocal(row.ended_at)}
          />
          <Input
            label={t("console.finance.time.edit.fields.durationMinutes", undefined, "Duration (Minutes)")}
            name="duration_minutes"
            type="number"
            defaultValue={row.duration_minutes != null ? String(row.duration_minutes) : ""}
          />
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="billable"
              defaultChecked={!!row.billable}
              className="rounded border-[var(--p-border)]"
            />
            <span>{t("console.finance.time.edit.fields.billable", undefined, "Billable")}</span>
          </label>
        </FormShell>
      </div>
    </>
  );
}
