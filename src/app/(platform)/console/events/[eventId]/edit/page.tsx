import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateEvent, type State } from "./actions";

export const dynamic = "force-dynamic";

function dateTimeLocal(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 16);
}

export default async function Page({ params }: { params: Promise<{ eventId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("events", session.orgId, p.eventId);
  if (!row) notFound();
  const { t } = await getRequestT();
  const action = updateEvent.bind(null, p.eventId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.events.edit.eyebrow", undefined, "Event")}
        title={t("console.events.edit.title", { name: row.name }, `Edit ${row.name}`)}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/events/${p.eventId}`}
          submitLabel={t("console.events.edit.submitLabel", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.events.edit.name", undefined, "Name")}
            name="name"
            defaultValue={row.name}
            required
            maxLength={200}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {t("console.events.edit.description", undefined, "Description")}
            </span>
            <textarea
              name="description"
              defaultValue={row.description ?? ""}
              rows={4}
              maxLength={4000}
              className="input-base focus-ring w-full"
            />
          </label>
          <Input
            label={t("console.events.edit.startsAt", undefined, "Starts At")}
            name="starts_at"
            type="datetime-local"
            defaultValue={dateTimeLocal(row.starts_at)}
            required
          />
          <Input
            label={t("console.events.edit.endsAt", undefined, "Ends At")}
            name="ends_at"
            type="datetime-local"
            defaultValue={dateTimeLocal(row.ends_at)}
            required
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {t("console.events.edit.status", undefined, "Status")}
            </span>
            <select name="status" defaultValue={row.status} required className="input-base focus-ring w-full">
              <option value="draft">{t("console.events.edit.statusDraft", undefined, "draft")}</option>
              <option value="scheduled">{t("console.events.edit.statusScheduled", undefined, "scheduled")}</option>
              <option value="live">{t("console.events.edit.statusLive", undefined, "live")}</option>
              <option value="complete">{t("console.events.edit.statusComplete", undefined, "complete")}</option>
              <option value="cancelled">{t("console.events.edit.statusCancelled", undefined, "cancelled")}</option>
            </select>
          </label>
        </FormShell>
      </div>
    </>
  );
}
