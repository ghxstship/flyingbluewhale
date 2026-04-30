import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { createServiceRequest } from "../actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Services" title="Open service request" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const [projects, venues] = await Promise.all([
    listOrgScoped("projects", session.orgId, { orderBy: "name", ascending: true, limit: 200 }) as Promise<
      Array<{ id: string; name: string }>
    >,
    listOrgScoped("venues", session.orgId, { orderBy: "name", ascending: true, limit: 200 }) as Promise<
      Array<{ id: string; name: string }>
    >,
  ]);

  return (
    <>
      <ModuleHeader eyebrow="Services" title="Open service request" />
      <div className="page-content max-w-xl">
        <FormShell action={createServiceRequest} cancelHref="/console/services/requests" submitLabel="Open request">
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Category</label>
            <select name="category" defaultValue="AV" className="input-base mt-1.5 w-full" required>
              <option value="AV">AV</option>
              <option value="cleaning">Cleaning</option>
              <option value="repair">Repair</option>
              <option value="IT">IT</option>
              <option value="hospitality">Hospitality</option>
              <option value="security">Security</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Severity</label>
            <select name="severity" defaultValue="P3" className="input-base mt-1.5 w-full" required>
              <option value="P1">P1 — live-event blocker (5m ack, 1h resolve)</option>
              <option value="P2">P2 — urgent (15m ack, 4h resolve)</option>
              <option value="P3">P3 — standard (1h ack, 1d resolve)</option>
              <option value="P4">P4 — low (4h ack, 3d resolve)</option>
            </select>
          </div>
          <Input label="Summary" name="summary" maxLength={200} placeholder="One-line description" required />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Description</label>
            <textarea name="description" rows={4} maxLength={4000} className="input-base mt-1.5 w-full" />
          </div>
          {projects.length > 0 && (
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)]">Project (optional)</label>
              <select name="project_id" defaultValue="" className="input-base mt-1.5 w-full">
                <option value="">— none —</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {venues.length > 0 && (
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)]">Venue (optional)</label>
              <select name="venue_id" defaultValue="" className="input-base mt-1.5 w-full">
                <option value="">— none —</option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </FormShell>
      </div>
    </>
  );
}
