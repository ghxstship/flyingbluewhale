import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createCallAction } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Marketplace" title="New Open Call" subtitle="Casting, RFP, or audition." />
      <div className="page-content max-w-2xl">
        <FormShell action={createCallAction} cancelHref="/console/marketplace/calls" submitLabel="Save Draft">
          <Input label="Title" name="title" required maxLength={200} />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Kind</label>
            <select name="kind" className="input-base mt-1.5 w-full" defaultValue="talent_call">
              <option value="talent_call">Talent Call</option>
              <option value="audition">Audition</option>
              <option value="gig">Gig</option>
              <option value="rfq">Public RFQ</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Description</label>
            <textarea name="description" rows={6} maxLength={8000} className="input-base mt-1.5 w-full" />
          </div>
          <Input label="Genre Tags (comma-separated)" name="genre_tags" placeholder="house, techno, indie-rock" />
          <Input
            label="Trade Categories (comma-separated)"
            name="trade_categories"
            placeholder="lighting, audio, fabrication"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Region" name="region" maxLength={80} />
            <Input label="Venue Type" name="venue_type" maxLength={80} placeholder="Festival mainstage" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Performance Date" name="performance_date" type="date" />
            <Input label="Slot (min)" name="slot_length_min" type="number" />
            <Input label="Deadline" name="deadline_at" type="datetime-local" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Fee Min" name="fee_min" placeholder="2500" />
            <Input label="Fee Max" name="fee_max" placeholder="7500" />
            <Input label="Currency" name="currency" maxLength={3} defaultValue="USD" />
          </div>
        </FormShell>
      </div>
    </>
  );
}
