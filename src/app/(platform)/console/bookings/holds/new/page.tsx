import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { createTieredHoldAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Bookings" title="New Hold" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const [{ data: venues }, { data: talent }] = await Promise.all([
    supabase.from("venues").select("id, name").eq("org_id", session.orgId).order("name").limit(500),
    supabase.from("talent_profiles").select("id, act_name").eq("org_id", session.orgId).order("act_name").limit(500),
  ]);

  return (
    <>
      <ModuleHeader eyebrow="Bookings" title="New Hold" subtitle="Tier 1 = first refusal." />
      <div className="page-content max-w-xl">
        <FormShell action={createTieredHoldAction} cancelHref="/console/bookings/holds" submitLabel="Place Hold">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)]">Tier</label>
              <select name="tier" className="input-base mt-1.5 w-full" defaultValue="1">
                <option value="1">Tier 1 (first refusal)</option>
                <option value="2">Tier 2</option>
                <option value="3">Tier 3</option>
                <option value="4">Tier 4</option>
                <option value="5">Tier 5</option>
              </select>
            </div>
            <Input label="Label" name="label" placeholder="MMW26 mainstage" maxLength={200} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Starts" name="starts_at" type="datetime-local" required />
            <Input label="Ends" name="ends_at" type="datetime-local" required />
          </div>
          <Input label="Auto-release on" name="auto_release_on" type="datetime-local" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)]">Venue (optional)</label>
              <select name="venue_id" className="input-base mt-1.5 w-full" defaultValue="">
                <option value="">—</option>
                {(venues ?? []).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)]">Talent (optional)</label>
              <select name="talent_profile_id" className="input-base mt-1.5 w-full" defaultValue="">
                <option value="">—</option>
                {(talent ?? []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.act_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </FormShell>
      </div>
    </>
  );
}
