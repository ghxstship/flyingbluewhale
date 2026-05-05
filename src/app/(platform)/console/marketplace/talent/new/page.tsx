import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createTalentAction } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Marketplace" title="New Talent Profile" subtitle="Create the EPK. Publish when ready." />
      <div className="page-content max-w-2xl">
        <FormShell action={createTalentAction} cancelHref="/console/marketplace/talent" submitLabel="Save Profile">
          <Input label="Act Name" name="act_name" required maxLength={200} />
          <Input label="Tagline" name="tagline" maxLength={200} placeholder="L.A. four-piece. Dust and dance music." />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Bio</label>
            <textarea name="bio" rows={6} maxLength={8000} className="input-base mt-1.5 w-full" />
          </div>
          <Input label="Genre Tags (comma-separated)" name="genre_tags" placeholder="indie-rock, post-punk" />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Fee Min" name="fee_min" placeholder="2500" />
            <Input label="Fee Max" name="fee_max" placeholder="7500" />
            <Input label="Currency" name="currency" defaultValue="USD" maxLength={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Travel Radius (km)" name="travel_radius_km" type="number" />
            <Input label="Deposit %" name="deposit_pct" type="number" defaultValue="60" min={0} max={100} />
          </div>
          <Input label="Reel URL" name="video_reel_url" placeholder="https://youtube.com/watch?v=..." />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Agent Name" name="agent_name" maxLength={120} />
            <Input label="Agent Email" name="agent_email" type="email" />
          </div>
        </FormShell>
      </div>
    </>
  );
}
