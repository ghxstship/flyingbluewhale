import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { updateRfi } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "ps-input w-full";
const LBL = "text-xs font-medium text-[var(--p-text-2)]";

type Rfi = {
  id: string;
  code: string | null;
  subject: string;
  question: string;
  project_id: string;
  category: string | null;
  ball_in_court_id: string | null;
  priority: "low" | "normal" | "high" | "urgent";
  status: "open" | "answered" | "closed";
  due_at: string | null;
  official_answer: string | null;
  updated_at: string;
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const [{ data }, { data: projects }, { data: users }] = await Promise.all([
    supabase
      .from("rfis")
      .select(
        "id, code, subject, question, project_id, category, ball_in_court_id, priority, rfi_state, due_at, official_answer, updated_at",
      )
      .eq("id", id)
      .eq("org_id", session.orgId)
      .maybeSingle(),
    supabase.from("projects").select("id, name, updated_at").eq("org_id", session.orgId).order("name"),
    supabase.from("users").select("id, name, email").limit(200),
  ]);

  const rfi = data as unknown as Rfi | null;
  if (!rfi) notFound();

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.rfis.edit.eyebrow", undefined, "Operations")}
        title={`${t("console.rfis.edit.title", undefined, "Edit RFI")} · ${rfi.code ?? rfi.id.slice(0, 8)}`}
        subtitle={t("console.rfis.edit.subtitle", undefined, "Edit RFI.")}
        breadcrumbs={[
          { label: t("console.rfis.breadcrumb", undefined, "RFIs"), href: "/studio/rfis" },
          { label: rfi.code ?? t("console.rfis.edit.rfiFallback", undefined, "RFI"), href: `/studio/rfis/${rfi.id}` },
          { label: t("common.edit", undefined, "Edit") },
        ]}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={updateRfi}
          cancelHref={`/studio/rfis/${rfi.id}`}
          submitLabel={t("console.rfis.edit.submit", undefined, "Save RFI")}
          dirtyGuard
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={rfi.updated_at} />
          <input type="hidden" name="id" value={rfi.id} />

          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              {t("console.rfis.fields.subject", undefined, "Subject")}
              <span className="ms-0.5 text-[var(--p-danger)]">*</span>
            </span>
            <input name="subject" required defaultValue={rfi.subject} maxLength={200} className={INPUT} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              {t("console.rfis.fields.question", undefined, "Question")}
              <span className="ms-0.5 text-[var(--p-danger)]">*</span>
            </span>
            <textarea
              name="question"
              rows={4}
              required
              defaultValue={rfi.question}
              maxLength={4000}
              className={INPUT}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.rfis.fields.project", undefined, "Project")}
                <span className="ms-0.5 text-[var(--p-danger)]">*</span>
              </span>
              <select name="project_id" required defaultValue={rfi.project_id} className={INPUT}>
                {(projects ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.rfis.fields.category", undefined, "Category")}</span>
              <input name="category" defaultValue={rfi.category ?? ""} className={INPUT} />
            </label>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.rfis.fields.ballInCourt", undefined, "Ball in court")}</span>
              <select name="ball_in_court_id" defaultValue={rfi.ball_in_court_id ?? ""} className={INPUT}>
                <option value="">—</option>
                {(users ?? []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name ?? u.email}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.rfis.fields.priority", undefined, "Priority")}</span>
              <select name="priority" defaultValue={rfi.priority} className={INPUT}>
                {["low", "normal", "high", "urgent"].map((p) => (
                  <option key={p} value={p}>
                    {toTitle(p)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.rfis.fields.status", undefined, "Status")}</span>
              <select name="status" defaultValue={rfi.status} className={INPUT}>
                {["open", "answered", "closed"].map((s) => (
                  <option key={s} value={s}>
                    {toTitle(s)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className={LBL}>{t("console.rfis.fields.dueBy", undefined, "Due by")}</span>
            <input
              type="date"
              name="due_at"
              defaultValue={rfi.due_at ? rfi.due_at.slice(0, 10) : ""}
              className={INPUT}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={LBL}>{t("console.rfis.fields.officialAnswer", undefined, "Official answer")}</span>
            <textarea
              name="official_answer"
              rows={5}
              defaultValue={rfi.official_answer ?? ""}
              maxLength={8000}
              placeholder={t(
                "console.rfis.edit.officialAnswerPlaceholder",
                undefined,
                "Set status to Answered or Closed to record the answered_at timestamp.",
              )}
              className={INPUT}
            />
          </label>
        </FormShell>
      </div>
    </>
  );
}
