import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { updateInspection } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--text-secondary)]";

const STATUSES = ["scheduled", "in_progress", "passed", "failed", "cancelled"] as const;

type Inspection = {
  id: string;
  code: string | null;
  name: string;
  project_id: string | null;
  status: (typeof STATUSES)[number];
  scheduled_for: string | null;
  inspector_id: string | null;
  notes: string | null;
  updated_at: string;
};

function toDateTimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // Convert to YYYY-MM-DDTHH:mm in local time
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const [{ data }, { data: projects }, { data: users }] = await Promise.all([
    supabase
      .from("inspections")
      .select("id, code, name, project_id, status, scheduled_for, inspector_id, notes, updated_at")
      .eq("id", id)
      .eq("org_id", session.orgId)
      .maybeSingle(),
    supabase.from("projects").select("id, name").eq("org_id", session.orgId).order("name"),
    supabase.from("users").select("id, name, email").limit(200),
  ]);

  const insp = data as unknown as Inspection | null;
  if (!insp) notFound();

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.inspections.edit.eyebrow", undefined, "Safety")}
        title={`${t("console.inspections.edit.title", undefined, "Edit Inspection")} · ${insp.code ?? insp.id.slice(0, 8)}`}
        subtitle={t("console.inspections.edit.subtitle", undefined, "Edit inspection.")}
        breadcrumbs={[
          { label: t("console.inspections.breadcrumb", undefined, "Inspections"), href: "/console/inspections" },
          {
            label: insp.code ?? t("console.inspections.edit.inspectionFallback", undefined, "Inspection"),
            href: `/console/inspections/${insp.id}`,
          },
          { label: t("common.edit", undefined, "Edit") },
        ]}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={updateInspection}
          cancelHref={`/console/inspections/${insp.id}`}
          submitLabel={t("console.inspections.edit.submit", undefined, "Save Inspection")}
          dirtyGuard
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={insp.updated_at} />
          <input type="hidden" name="id" value={insp.id} />

          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              {t("console.inspections.edit.fields.name", undefined, "Name")}
              <span className="ms-0.5 text-[var(--color-error)]">*</span>
            </span>
            <input name="name" required defaultValue={insp.name} maxLength={200} className={INPUT} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.inspections.edit.fields.project", undefined, "Project")}</span>
              <select name="project_id" defaultValue={insp.project_id ?? ""} className={INPUT}>
                <option value="">—</option>
                {(projects ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.inspections.edit.fields.status", undefined, "Status")}</span>
              <select name="status" defaultValue={insp.status} className={INPUT}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {toTitle(s)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.inspections.edit.fields.scheduledFor", undefined, "Scheduled for")}
              </span>
              <input
                type="datetime-local"
                name="scheduled_for"
                defaultValue={toDateTimeLocal(insp.scheduled_for)}
                className={INPUT}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.inspections.edit.fields.inspector", undefined, "Inspector")}</span>
              <select name="inspector_id" defaultValue={insp.inspector_id ?? ""} className={INPUT}>
                <option value="">—</option>
                {(users ?? []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name ?? u.email}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className={LBL}>{t("console.inspections.edit.fields.notes", undefined, "Notes")}</span>
            <textarea name="notes" rows={4} defaultValue={insp.notes ?? ""} maxLength={2000} className={INPUT} />
          </label>
        </FormShell>
      </div>
    </>
  );
}
