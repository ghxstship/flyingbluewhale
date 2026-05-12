export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { createTourAction } from "./actions";

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Agency" title="New Tour" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const [talentResp, agencyResp] = await Promise.all([
    supabase
      .from("talent_profiles")
      .select("id, act_name")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("act_name"),
    supabase
      .from("agencies")
      .select("id, display_name")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("display_name"),
  ]);
  const talents = (talentResp.data ?? []) as Array<{ id: string; act_name: string }>;
  const agencies = (agencyResp.data ?? []) as Array<{ id: string; display_name: string }>;

  return (
    <>
      <ModuleHeader
        eyebrow="Agency"
        title="New Tour"
        subtitle="Multi-date routing container. P&L rolls up across linked offers."
      />
      <div className="page-content max-w-xl">
        <FormShell action={createTourAction} cancelHref="/console/agency/tours" submitLabel="Create Tour">
          <Input label="Tour Name" name="name" required maxLength={200} />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Talent</label>
            <select name="talent_profile_id" required className="input-base mt-1.5 w-full">
              <option value="">Select an act…</option>
              {talents.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.act_name}
                </option>
              ))}
            </select>
          </div>
          {agencies.length > 0 && (
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)]">Agency (optional)</label>
              <select name="agency_id" className="input-base mt-1.5 w-full">
                <option value="">—</option>
                {agencies.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.display_name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input label="Starts" name="starts_on" type="date" />
            <Input label="Ends" name="ends_on" type="date" />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Description</label>
            <textarea name="description" rows={4} maxLength={4000} className="input-base mt-1.5 w-full" />
          </div>
        </FormShell>
      </div>
    </>
  );
}
