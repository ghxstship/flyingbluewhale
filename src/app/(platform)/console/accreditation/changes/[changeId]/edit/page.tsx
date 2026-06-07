import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateAccreditationChange, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ changeId: string }> }) {
  const { t } = await getRequestT();
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("accreditation_changes", session.orgId, p.changeId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  void r;
  const action = updateAccreditationChange.bind(null, p.changeId) as unknown as (
    state: State,
    fd: FormData,
  ) => Promise<State>;
  const kindValue =
    ((row as Record<string, unknown>)["kind"] as string | undefined) ??
    t("console.accreditation.changes.edit.fallbackKind", undefined, "Accreditation change");
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.accreditation.changes.edit.eyebrow", undefined, "Accreditation Change")}
        title={t("console.accreditation.changes.edit.title", { kind: kindValue }, `Edit ${kindValue}`)}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/accreditation/changes/${p.changeId}`}
          submitLabel={t("common.saveChanges", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.accreditation.changes.edit.kindLabel", undefined, "Kind")}
            name="kind"
            defaultValue={row.kind ?? ""}
            required
            maxLength={80}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.accreditation.changes.edit.statusLabel", undefined, "Status")}
            </span>
            <select name="status" defaultValue={row.status ?? ""} required className="ps-input focus-ring w-full">
              <option value="pending">{t("console.accreditation.changes.status.pending", undefined, "pending")}</option>
              <option value="approved">
                {t("console.accreditation.changes.status.approved", undefined, "approved")}
              </option>
              <option value="rejected">
                {t("console.accreditation.changes.status.rejected", undefined, "rejected")}
              </option>
              <option value="applied">{t("console.accreditation.changes.status.applied", undefined, "applied")}</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.accreditation.changes.edit.noteLabel", undefined, "Note")}
            </span>
            <textarea name="note" defaultValue={row.note ?? ""} rows={5} className="ps-input focus-ring w-full" />
          </label>
        </FormShell>
      </div>
    </>
  );
}
