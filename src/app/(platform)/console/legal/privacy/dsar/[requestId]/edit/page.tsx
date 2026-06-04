import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateDsarRequest, type State } from "./actions";

export const dynamic = "force-dynamic";

function dateOnly(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 10);
}

export default async function Page({ params }: { params: Promise<{ requestId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const { t } = await getRequestT();
  const row = await getOrgScoped("dsar_requests", session.orgId, p.requestId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  void r;
  const action = updateDsarRequest.bind(null, p.requestId) as unknown as (state: State, fd: FormData) => Promise<State>;
  const fallbackTitle = t("console.legal.privacy.dsar.edit.fallbackTitle", undefined, "DSAR request");
  const requesterEmail = ((row as Record<string, unknown>)["requester_email"] as string | undefined) ?? fallbackTitle;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legal.privacy.dsar.edit.eyebrow", undefined, "DSAR request")}
        title={t("console.legal.privacy.dsar.edit.title", { name: requesterEmail }, `Edit ${requesterEmail}`)}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/legal/privacy/dsar/${p.requestId}`}
          submitLabel={t("common.saveChanges", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.legal.privacy.dsar.edit.requesterEmailLabel", undefined, "Requester Email")}
            name="requester_email"
            type="email"
            defaultValue={row.requester_email ?? ""}
            required
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {t("console.legal.privacy.dsar.edit.kindLabel", undefined, "Kind")}
            </span>
            <select name="kind" defaultValue={row.kind ?? ""} required className="input-base focus-ring w-full">
              <option value="access">access</option>
              <option value="deletion">deletion</option>
              <option value="correction">correction</option>
              <option value="portability">portability</option>
              <option value="objection">objection</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {t("console.legal.privacy.dsar.edit.statusLabel", undefined, "Status")}
            </span>
            <select name="status" defaultValue={row.status ?? ""} required className="input-base focus-ring w-full">
              <option value="received">received</option>
              <option value="verifying">verifying</option>
              <option value="in_progress">in_progress</option>
              <option value="fulfilled">fulfilled</option>
              <option value="rejected">rejected</option>
            </select>
          </label>
          <Input
            label={t("console.legal.privacy.dsar.edit.dueByLabel", undefined, "Due By")}
            name="due_by"
            type="date"
            defaultValue={dateOnly(row.due_by)}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {t("console.legal.privacy.dsar.edit.notesLabel", undefined, "Notes")}
            </span>
            <textarea name="notes" defaultValue={row.notes ?? ""} rows={5} className="input-base focus-ring w-full" />
          </label>
        </FormShell>
      </div>
    </>
  );
}
