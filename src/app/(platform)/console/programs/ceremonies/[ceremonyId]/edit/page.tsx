import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateCeremony, type State } from "./actions";

export const dynamic = "force-dynamic";

function dateTimeLocal(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 16);
}

export default async function Page({ params }: { params: Promise<{ ceremonyId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("events", session.orgId, p.ceremonyId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  void r;
  const { t } = await getRequestT();
  const action = updateCeremony.bind(null, p.ceremonyId) as unknown as (state: State, fd: FormData) => Promise<State>;
  const ceremonyName =
    ((row as Record<string, unknown>)["name"] as string | undefined) ??
    t("console.programs.ceremonies.edit.fallbackName", undefined, "Ceremony");
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.programs.ceremonies.edit.eyebrow", undefined, "Ceremony")}
        title={t("console.programs.ceremonies.edit.title", { name: ceremonyName }, `Edit ${ceremonyName}`)}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/programs/ceremonies/${p.ceremonyId}`}
          submitLabel={t("common.saveChanges", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.programs.ceremonies.edit.fields.title", undefined, "Title")}
            name="name"
            defaultValue={row.name ?? ""}
            required
            maxLength={200}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.programs.ceremonies.edit.fields.description", undefined, "Description")}
            </span>
            <textarea
              name="description"
              defaultValue={row.description ?? ""}
              rows={5}
              className="ps-input focus-ring w-full"
            />
          </label>
          <Input
            label={t("console.programs.ceremonies.edit.fields.startsAt", undefined, "Starts At")}
            name="starts_at"
            type="datetime-local"
            defaultValue={dateTimeLocal(row.starts_at)}
            required
          />
          <Input
            label={t("console.programs.ceremonies.edit.fields.endsAt", undefined, "Ends At")}
            name="ends_at"
            type="datetime-local"
            defaultValue={dateTimeLocal(row.ends_at)}
            required
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.programs.ceremonies.edit.fields.status", undefined, "Status")}
            </span>
            <select name="status" defaultValue={row.status ?? ""} required className="ps-input focus-ring w-full">
              <option value="draft">{t("console.programs.ceremonies.edit.status.draft", undefined, "draft")}</option>
              <option value="scheduled">
                {t("console.programs.ceremonies.edit.status.scheduled", undefined, "scheduled")}
              </option>
              <option value="live">{t("console.programs.ceremonies.edit.status.live", undefined, "live")}</option>
              <option value="complete">
                {t("console.programs.ceremonies.edit.status.complete", undefined, "complete")}
              </option>
              <option value="cancelled">
                {t("console.programs.ceremonies.edit.status.cancelled", undefined, "cancelled")}
              </option>
            </select>
          </label>
        </FormShell>
      </div>
    </>
  );
}
