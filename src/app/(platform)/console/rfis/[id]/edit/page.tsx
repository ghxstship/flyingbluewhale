import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { updateRfi } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--text-secondary)]";

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

  const [{ data }, { data: projects }, { data: users }] = await Promise.all([
    supabase
      .from("rfis")
      .select(
        "id, code, subject, question, project_id, category, ball_in_court_id, priority, status, due_at, official_answer",
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
        eyebrow="Operations"
        title={`Edit RFI · ${rfi.code ?? rfi.id.slice(0, 8)}`}
        subtitle="Edit RFI."
        breadcrumbs={[
          { label: "RFIs", href: "/console/rfis" },
          { label: rfi.code ?? "RFI", href: `/console/rfis/${rfi.id}` },
          { label: "Edit" },
        ]}
      />
      <div className="page-content max-w-2xl">
        <FormShell action={updateRfi} cancelHref={`/console/rfis/${rfi.id}`} submitLabel="Save RFI" dirtyGuard>
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={rfi.updated_at} />
          <input type="hidden" name="id" value={rfi.id} />

          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              Subject<span className="ms-0.5 text-[var(--color-error)]">*</span>
            </span>
            <input name="subject" required defaultValue={rfi.subject} maxLength={200} className={INPUT} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              Question<span className="ms-0.5 text-[var(--color-error)]">*</span>
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
                Project<span className="ms-0.5 text-[var(--color-error)]">*</span>
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
              <span className={LBL}>Category</span>
              <input name="category" defaultValue={rfi.category ?? ""} className={INPUT} />
            </label>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Ball in court</span>
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
              <span className={LBL}>Priority</span>
              <select name="priority" defaultValue={rfi.priority} className={INPUT}>
                {["low", "normal", "high", "urgent"].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Status</span>
              <select name="status" defaultValue={rfi.status} className={INPUT}>
                {["open", "answered", "closed"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className={LBL}>Due by</span>
            <input
              type="date"
              name="due_at"
              defaultValue={rfi.due_at ? rfi.due_at.slice(0, 10) : ""}
              className={INPUT}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={LBL}>Official answer</span>
            <textarea
              name="official_answer"
              rows={5}
              defaultValue={rfi.official_answer ?? ""}
              maxLength={8000}
              placeholder="Set status to Answered or Closed to record the answered_at timestamp."
              className={INPUT}
            />
          </label>
        </FormShell>
      </div>
    </>
  );
}
