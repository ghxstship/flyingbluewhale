import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { createTransmittal } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--text-secondary)]";

export default async function Page() {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("name");

  return (
    <>
      <ModuleHeader
        eyebrow="Operations"
        title="New Transmittal"
        subtitle="Audit-grade dispatch envelope. Add items + recipients after creation; send when ready to start the read-receipt clock."
      />
      <div className="page-content max-w-2xl">
        <FormShell action={createTransmittal} cancelHref="/console/transmittals" submitLabel="Create Transmittal">
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              Subject<span className="ms-0.5 text-[var(--color-error)]">*</span>
            </span>
            <input name="subject" required placeholder="Issue 100% CD set + spec book Rev 2" className={INPUT} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                Project<span className="ms-0.5 text-[var(--color-error)]">*</span>
              </span>
              <select name="project_id" required className={INPUT}>
                <option value="">Select…</option>
                {((projects ?? []) as Array<{ id: string; name: string }>).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Response due</span>
              <input type="date" name="due_at" className={INPUT} />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>Body (Markdown)</span>
            <textarea
              name="body_md"
              rows={6}
              placeholder="Issuing per RFI-0023 resolution and 100% CD milestone. Please acknowledge by close of business Friday."
              className={`${INPUT} text-xs`}
            />
          </label>
        </FormShell>
      </div>
    </>
  );
}
