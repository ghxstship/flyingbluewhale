import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createAccountingPeriodAction } from "../actions";

export const dynamic = "force-dynamic";

export default function NewAccountingPeriodPage() {
  return (
    <>
      <ModuleHeader
        eyebrow="Finance"
        title="New Accounting Period"
        subtitle="Open a month, quarter, or fiscal period."
      />
      <div className="page-content">
        <FormShell action={createAccountingPeriodAction}>
          <div className="grid max-w-xl gap-4">
            <label className="block">
              <span className="text-sm font-medium">Label</span>
              <Input name="period_label" required placeholder="e.g. June 2026 / Q2 2026 / FY2026" />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Starts on</span>
              <Input name="starts_on" type="date" required />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Ends on</span>
              <Input name="ends_on" type="date" required />
            </label>
            <div className="flex gap-2">
              <Button type="submit">Open Period</Button>
              <Button href="/console/finance/periods" variant="secondary">
                Cancel
              </Button>
            </div>
          </div>
        </FormShell>
      </div>
    </>
  );
}
