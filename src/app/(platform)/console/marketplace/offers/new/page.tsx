import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { createOfferAction } from "./actions";

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Marketplace" title="New Offer" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const [talentResp, projResp] = await Promise.all([
    supabase
      .from("talent_profiles")
      .select("id, act_name")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("act_name"),
    supabase.from("projects").select("id, name").eq("org_id", session.orgId).order("name").limit(200),
  ]);
  const talents = (talentResp.data ?? []) as Array<{ id: string; act_name: string }>;
  const projects = (projResp.data ?? []) as Array<{ id: string; name: string }>;

  return (
    <>
      <ModuleHeader eyebrow="Marketplace" title="New Offer" subtitle="Default 60/40, balance on load-in." />
      <div className="page-content max-w-xl">
        <FormShell action={createOfferAction} cancelHref="/console/marketplace/offers" submitLabel="Save Draft">
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Talent</label>
            <select name="talent_profile_id" required className="input-base mt-1.5 w-full">
              <option value="">Select a talent profile…</option>
              {talents.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.act_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Project (optional)</label>
            <select name="project_id" className="input-base mt-1.5 w-full">
              <option value="">—</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <Input label="Performance Date" name="performance_date" type="date" required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Slot Start" name="slot_start" type="datetime-local" />
            <Input label="Slot End" name="slot_end" type="datetime-local" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Fee" name="fee" required placeholder="5000" />
            <Input label="Currency" name="currency" maxLength={3} defaultValue="USD" />
            <Input label="Deposit %" name="deposit_pct" type="number" defaultValue="60" min={0} max={100} />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Balance Terms</label>
            <select name="balance_terms" className="input-base mt-1.5 w-full" defaultValue="load_in">
              <option value="load_in">On Load-In</option>
              <option value="show_day">On Show Day</option>
              <option value="net_30">Net 30 Post-Show</option>
            </select>
          </div>
        </FormShell>
      </div>
    </>
  );
}
