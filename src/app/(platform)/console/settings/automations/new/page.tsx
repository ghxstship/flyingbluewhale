import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { createAutomationAction } from "./actions";

export const dynamic = "force-dynamic";

const TRIGGER_EVENTS = [
  { value: "assignment.created", label: "Assignment Created" },
  { value: "assignment.state_changed", label: "Assignment State Changed" },
  { value: "proposal.approved", label: "Proposal Approved" },
  { value: "invoice.paid", label: "Invoice Paid" },
  { value: "deliverable.submitted", label: "Deliverable Submitted" },
  { value: "crew.checked_in", label: "Crew Checked In" },
  { value: "time_entry.flagged", label: "Time Entry Flagged" },
];

export default async function NewAutomationPage() {
  const { t } = await getRequestT();
  if (hasSupabase) {
    await requireSession();
  }

  return (
    <>
      <ModuleHeader
        eyebrow="Settings · Automations"
        title="New Automation Rule"
        subtitle="Trigger automated actions when platform events occur"
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createAutomationAction}
          cancelHref="/console/settings/automations"
          submitLabel={t("common.create", undefined, "Create")}
        >
          <Input label="Name" name="name" required maxLength={255} placeholder="e.g. Notify AM when proposal approved" />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">Description</label>
            <textarea
              name="description"
              rows={3}
              className="ps-input mt-1.5 w-full"
              placeholder="What does this automation do?"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">Trigger Event</label>
            <select name="trigger_event" required className="ps-input mt-1.5 w-full">
              {TRIGGER_EVENTS.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="is_active"
              id="is_active"
              defaultChecked
              value="on"
              className="h-4 w-4 rounded border-[var(--p-border)] accent-[var(--p-accent)]"
            />
            <label htmlFor="is_active" className="text-sm text-[var(--p-text-1)]">
              Activate immediately
            </label>
          </div>
        </FormShell>
      </div>
    </>
  );
}
