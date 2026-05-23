import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createSubscriptionAction } from "../actions";
import { SUBSCRIPTION_KINDS } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

export default function NewSubscriptionPage() {
  return (
    <>
      <ModuleHeader
        eyebrow="Subscriptions"
        title="New Subscription"
        subtitle="Recurring member, retainer, or sponsor."
      />
      <div className="page-content">
        <FormShell action={createSubscriptionAction}>
          <div className="grid max-w-xl gap-4">
            <label className="block">
              <span className="text-sm font-medium">Label</span>
              <Input name="label" required placeholder="e.g. HVRBOR Founding Member 2026" />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Kind</span>
              <select name="kind" required className="input w-full">
                {SUBSCRIPTION_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium">Party (optional UUID)</span>
              <Input name="party_id" placeholder="UUID of the subscriber user/party" />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Renewal cadence (months)</span>
              <Input name="renewal_cadence_months" type="number" min={1} max={120} placeholder="e.g. 12" />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Trial days (optional, starts as TRIAL state)</span>
              <Input name="trial_days" type="number" min={0} max={365} placeholder="e.g. 14" />
            </label>
            <div className="flex gap-2">
              <Button type="submit">Create Subscription</Button>
              <Button href="/console/subscriptions" variant="secondary">
                Cancel
              </Button>
            </div>
          </div>
        </FormShell>
      </div>
    </>
  );
}
