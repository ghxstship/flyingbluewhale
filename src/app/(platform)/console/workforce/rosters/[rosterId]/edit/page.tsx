import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateRoster, type State } from "./actions";

export const dynamic = "force-dynamic";

function dateOnly(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 10);
}

export default async function Page({ params }: { params: Promise<{ rosterId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("rosters", session.orgId, p.rosterId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  void r;
  const { t } = await getRequestT();
  const action = updateRoster.bind(null, p.rosterId) as unknown as (state: State, fd: FormData) => Promise<State>;
  const rosterName =
    ((row as Record<string, unknown>)["name"] as string | undefined) ??
    t("console.workforce.rosters.edit.fallbackName", undefined, "Roster");
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.rosters.edit.eyebrow", undefined, "Roster")}
        title={t("console.workforce.rosters.edit.title", { name: rosterName }, `Edit ${rosterName}`)}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/workforce/rosters/${p.rosterId}`}
          submitLabel={t("console.workforce.rosters.edit.submit", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.workforce.rosters.edit.fields.name", undefined, "Name")}
            name="name"
            defaultValue={row.name ?? ""}
            required
            maxLength={200}
          />
          <Input
            label={t("console.workforce.rosters.edit.fields.dayOf", undefined, "Day Of")}
            name="day_of"
            type="date"
            defaultValue={dateOnly(row.day_of)}
            required
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.workforce.rosters.edit.fields.state", undefined, "State")}
            </span>
            <select name="state" defaultValue={row.state ?? ""} required className="ps-input focus-ring w-full">
              <option value="draft">{t("console.workforce.rosters.edit.state.draft", undefined, "draft")}</option>
              <option value="published">
                {t("console.workforce.rosters.edit.state.published", undefined, "published")}
              </option>
              <option value="locked">{t("console.workforce.rosters.edit.state.locked", undefined, "locked")}</option>
            </select>
          </label>
        </FormShell>
      </div>
    </>
  );
}
