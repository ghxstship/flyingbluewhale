export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { updateTalentAction } from "./actions";

type Talent = {
  id: string;
  act_name: string;
  tagline: string | null;
  bio: string | null;
  genre_tags: string[];
  fee_min_cents: number | null;
  fee_max_cents: number | null;
  currency: string;
  travel_radius_km: number | null;
  deposit_pct: number;
  agent_email: string | null;
  agent_name: string | null;
  video_reel_url: string | null;
};

const dollars = (cents: number | null) => (cents == null ? "" : (cents / 100).toFixed(0));

export default async function Page({ params }: { params: Promise<{ talentId: string }> }) {
  const { talentId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("talent_profiles")
    .select("*")
    .eq("id", talentId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!data) return notFound();
  const t = data as Talent;

  return (
    <>
      <ModuleHeader eyebrow="Marketplace · Talent" title={`Edit · ${t.act_name}`} />
      <div className="page-content max-w-2xl">
        <FormShell
          action={updateTalentAction}
          cancelHref={`/console/marketplace/talent/${t.id}`}
          submitLabel="Save Changes"
        >
          <input type="hidden" name="talent_id" value={t.id} />
          <Input label="Act Name" name="act_name" required maxLength={200} defaultValue={t.act_name} />
          <Input label="Tagline" name="tagline" maxLength={200} defaultValue={t.tagline ?? ""} />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Bio</label>
            <textarea
              name="bio"
              rows={6}
              maxLength={8000}
              className="input-base mt-1.5 w-full"
              defaultValue={t.bio ?? ""}
            />
          </div>
          <Input label="Genre Tags (comma-separated)" name="genre_tags" defaultValue={t.genre_tags.join(", ")} />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Fee Min" name="fee_min" defaultValue={dollars(t.fee_min_cents)} />
            <Input label="Fee Max" name="fee_max" defaultValue={dollars(t.fee_max_cents)} />
            <Input label="Currency" name="currency" maxLength={3} defaultValue={t.currency} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Travel Radius (km)"
              name="travel_radius_km"
              type="number"
              defaultValue={t.travel_radius_km ?? ""}
            />
            <Input label="Deposit %" name="deposit_pct" type="number" min={0} max={100} defaultValue={t.deposit_pct} />
          </div>
          <Input label="Reel URL" name="video_reel_url" defaultValue={t.video_reel_url ?? ""} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Agent Name" name="agent_name" defaultValue={t.agent_name ?? ""} />
            <Input label="Agent Email" name="agent_email" type="email" defaultValue={t.agent_email ?? ""} />
          </div>
        </FormShell>
      </div>
    </>
  );
}
