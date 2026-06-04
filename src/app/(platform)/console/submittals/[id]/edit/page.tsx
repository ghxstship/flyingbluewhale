import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { updateSubmittal } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--text-secondary)]";

const STATUSES = [
  "draft",
  "submitted",
  "in_review",
  "approved",
  "approved_with_comments",
  "revise_resubmit",
  "rejected",
  "void",
  "closed",
] as const;

type Submittal = {
  id: string;
  code: string | null;
  title: string;
  project_id: string;
  spec_section: string | null;
  vendor_id: string | null;
  ball_in_court_id: string | null;
  status: (typeof STATUSES)[number];
  due_at: string | null;
  updated_at: string;
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const [{ data }, { data: projects }, { data: vendors }, { data: users }] = await Promise.all([
    supabase
      .from("submittals")
      .select("id, code, title, project_id, spec_section, vendor_id, ball_in_court_id, status, due_at, updated_at")
      .eq("id", id)
      .eq("org_id", session.orgId)
      .maybeSingle(),
    supabase.from("projects").select("id, name").eq("org_id", session.orgId).order("name"),
    supabase.from("vendors").select("id, name").eq("org_id", session.orgId).order("name"),
    supabase.from("users").select("id, name, email").limit(200),
  ]);

  const sub = data as unknown as Submittal | null;
  if (!sub) notFound();

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.submittals.edit.eyebrow", undefined, "Operations")}
        title={`${t("console.submittals.edit.title", undefined, "Edit Submittal")} · ${sub.code ?? sub.id.slice(0, 8)}`}
        subtitle={t("console.submittals.edit.subtitle", undefined, "Update title, status, vendor, and ball-in-court.")}
        breadcrumbs={[
          {
            label: t("console.submittals.edit.breadcrumbs.submittals", undefined, "Submittals"),
            href: "/console/submittals",
          },
          {
            label: sub.code ?? t("console.submittals.edit.breadcrumbs.submittal", undefined, "Submittal"),
            href: `/console/submittals/${sub.id}`,
          },
          { label: t("console.submittals.edit.breadcrumbs.edit", undefined, "Edit") },
        ]}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={updateSubmittal}
          cancelHref={`/console/submittals/${sub.id}`}
          submitLabel={t("console.submittals.edit.submitLabel", undefined, "Save Submittal")}
          dirtyGuard
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={sub.updated_at} />
          <input type="hidden" name="id" value={sub.id} />

          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              {t("console.submittals.edit.fields.title", undefined, "Title")}
              <span className="ms-0.5 text-[var(--color-error)]">*</span>
            </span>
            <input name="title" required defaultValue={sub.title} maxLength={200} className={INPUT} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.submittals.edit.fields.project", undefined, "Project")}
                <span className="ms-0.5 text-[var(--color-error)]">*</span>
              </span>
              <select name="project_id" required defaultValue={sub.project_id} className={INPUT}>
                {(projects ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.submittals.edit.fields.specSection", undefined, "Spec Section")}</span>
              <input name="spec_section" defaultValue={sub.spec_section ?? ""} maxLength={80} className={INPUT} />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.submittals.edit.fields.vendor", undefined, "Vendor")}</span>
              <select name="vendor_id" defaultValue={sub.vendor_id ?? ""} className={INPUT}>
                <option value="">—</option>
                {(vendors ?? []).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.submittals.edit.fields.ballInCourt", undefined, "Ball In Court")}</span>
              <select name="ball_in_court_id" defaultValue={sub.ball_in_court_id ?? ""} className={INPUT}>
                <option value="">—</option>
                {(users ?? []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name ?? u.email}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.submittals.edit.fields.status", undefined, "Status")}</span>
              <select name="status" defaultValue={sub.status} className={INPUT}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {toTitle(s)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.submittals.edit.fields.dueBy", undefined, "Due By")}</span>
              <input
                type="date"
                name="due_at"
                defaultValue={sub.due_at ? sub.due_at.slice(0, 10) : ""}
                className={INPUT}
              />
            </label>
          </div>
        </FormShell>
      </div>
    </>
  );
}
