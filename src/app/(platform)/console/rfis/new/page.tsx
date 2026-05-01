import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { createRfi } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--text-secondary)]";

export default async function Page() {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const [{ data: projects }, { data: users }] = await Promise.all([
    supabase.from("projects").select("id, name").eq("org_id", session.orgId).order("name"),
    supabase.from("users").select("id, name, email").limit(200),
  ]);

  return (
    <>
      <ModuleHeader
        eyebrow="Operations"
        title="New RFI"
        subtitle="Ask the production team an official question. Set ball-in-court so accountability is clear."
      />
      <div className="page-content max-w-2xl">
        <FormShell action={createRfi} cancelHref="/console/rfis" submitLabel="Open RFI">
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              Subject<span className="ms-0.5 text-[var(--color-error)]">*</span>
            </span>
            <input
              name="subject"
              required
              placeholder="Confirm rigging point load capacity at downstage left"
              className={INPUT}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              Question<span className="ms-0.5 text-[var(--color-error)]">*</span>
            </span>
            <textarea name="question" rows={4} required className={INPUT} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                Project<span className="ms-0.5 text-[var(--color-error)]">*</span>
              </span>
              <select name="project_id" required className={INPUT}>
                <option value="">Select…</option>
                {(projects ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Category</span>
              <input name="category" placeholder="rigging / power / brand / catering" className={INPUT} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Ball in court</span>
              <select name="ball_in_court_id" className={INPUT}>
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
              <select name="priority" className={INPUT} defaultValue="normal">
                {["low", "normal", "high", "urgent"].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>Due by</span>
            <input type="date" name="due_at" className={INPUT} />
          </label>
        </FormShell>
      </div>
    </>
  );
}
