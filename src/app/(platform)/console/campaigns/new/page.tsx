import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createCampaign } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Workspace" title="New Campaign" />
      <div className="page-content max-w-xl">
        <FormShell action={createCampaign} cancelHref="/console/campaigns" submitLabel="Create Campaign">
          <Input label="Name" name="name" maxLength={200} placeholder="Spring launch · 2026" required />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Description</label>
            <textarea
              name="description"
              rows={3}
              maxLength={2000}
              className="input-base mt-1.5 w-full"
              placeholder="What this campaign is for; success metric."
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Channel</label>
            <select name="channel" defaultValue="multi" className="input-base mt-1.5 w-full">
              <option value="email">Email</option>
              <option value="social">Social</option>
              <option value="paid">Paid</option>
              <option value="owned">Owned</option>
              <option value="earned">Earned</option>
              <option value="multi">Multi-channel</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Kind</label>
            <select name="kind" defaultValue="awareness" className="input-base mt-1.5 w-full">
              <option value="awareness">Awareness</option>
              <option value="conversion">Conversion</option>
              <option value="loyalty">Loyalty</option>
              <option value="recruitment">Recruitment</option>
              <option value="launch">Launch</option>
            </select>
          </div>
          <Input label="Starts On" name="starts_on" type="date" />
          <Input label="Ends On" name="ends_on" type="date" />
          <Input
            label="Budget (cents)"
            name="budget_cents"
            type="number"
            min={0}
            step={1}
            defaultValue={0}
            placeholder="500000 = $5,000"
          />
        </FormShell>
      </div>
    </>
  );
}
