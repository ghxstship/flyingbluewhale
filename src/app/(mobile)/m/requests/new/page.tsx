import Link from "next/link";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createServiceRequest } from "@/app/(platform)/console/services/requests/actions";

export const dynamic = "force-dynamic";

export default function MobileNewRequest() {
  return (
    <div className="px-4 pt-6 pb-24">
      <Link href="/m/requests" className="text-xs text-[var(--text-muted)]">
        ← Requests
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Open request</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Log it from the field. Pick the right severity — P1 wakes the on-call, P3 hits ops in the hour.
      </p>
      <div className="mt-5">
        <FormShell action={createServiceRequest} cancelHref="/m/requests" submitLabel="Open">
          <input type="hidden" name="shell" value="mobile" />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Severity</label>
            <select name="severity" defaultValue="P3" className="input-base mt-1.5 w-full" required>
              <option value="P1">P1 — live-event blocker</option>
              <option value="P2">P2 — urgent</option>
              <option value="P3">P3 — standard</option>
              <option value="P4">P4 — low</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Category</label>
            <select name="category" defaultValue="repair" className="input-base mt-1.5 w-full" required>
              <option value="AV">AV</option>
              <option value="cleaning">Cleaning</option>
              <option value="repair">Repair</option>
              <option value="IT">IT</option>
              <option value="hospitality">Hospitality</option>
              <option value="security">Security</option>
              <option value="other">Other</option>
            </select>
          </div>
          <Input label="Summary" name="summary" maxLength={200} placeholder="One line — what's wrong?" required />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Detail</label>
            <textarea
              name="description"
              rows={4}
              maxLength={4000}
              className="input-base mt-1.5 w-full"
              placeholder="Where, what, who's affected"
            />
          </div>
        </FormShell>
      </div>
    </div>
  );
}
