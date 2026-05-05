import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createPostingAction } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Marketplace" title="New Posting" subtitle="Drafts are private until you publish." />
      <div className="page-content max-w-2xl">
        <FormShell action={createPostingAction} cancelHref="/console/marketplace/postings" submitLabel="Save Draft">
          <Input label="Title" name="title" required maxLength={200} />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Description</label>
            <textarea name="description" rows={6} maxLength={8000} className="input-base mt-1.5 w-full" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)]">Posting Type</label>
              <select name="posting_type" className="input-base mt-1.5 w-full" defaultValue="single">
                <option value="single">Single</option>
                <option value="tour">Tour Leg</option>
                <option value="recurring">Recurring</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)]">Employment</label>
              <select name="employment_type" className="input-base mt-1.5 w-full" defaultValue="1099">
                <option value="1099">1099 Contractor</option>
                <option value="w2">W-2 Crew</option>
                <option value="contract">Contract</option>
                <option value="volunteer">Volunteer</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="City" name="city" maxLength={80} />
            <Input label="Region/State" name="region" maxLength={80} />
            <Input label="Country" name="country" maxLength={80} placeholder="US" />
          </div>
          <Input label="Roles (comma-separated)" name="role_taxonomy" placeholder="A1, A2, Lighting Designer, Rigger" />
          <Input label="Certifications Required" name="certs_required" placeholder="ETCP Rigging, OSHA-30" />
          <Input label="Unions Required" name="union_required" placeholder="IATSE Local 1, IATSE Local 80" />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Day Rate Min" name="day_rate_min" placeholder="450" />
            <Input label="Day Rate Max" name="day_rate_max" placeholder="900" />
            <Input label="Currency" name="currency" maxLength={3} defaultValue="USD" />
          </div>
          <fieldset className="surface-inset flex flex-col gap-2 p-3">
            <legend className="text-xs font-medium tracking-wide uppercase">Provided</legend>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="travel_paid" /> Travel paid
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="lodging_provided" /> Lodging provided
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="vetted_only" /> Vetted-only (verified-creds candidates)
            </label>
          </fieldset>
        </FormShell>
      </div>
    </>
  );
}
