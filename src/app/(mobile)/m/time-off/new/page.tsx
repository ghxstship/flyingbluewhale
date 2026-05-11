import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { createTimeOffRequest } from "../actions";

export const dynamic = "force-dynamic";

type Policy = { id: string; name: string; policy_kind: string };

export default async function NewTimeOffPage() {
  if (!hasSupabase) return <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">Configure Supabase.</div>;
  const session = await requireSession();
  const supabase = await createClient();
  const { data: policies } = await supabase
    .from("time_off_policies")
    .select("id, name, policy_kind")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("name");

  const list = (policies ?? []) as Policy[];

  return (
    <div className="px-4 pt-6 pb-24">
      <h1 className="text-xl font-semibold">New Time-Off Request</h1>
      <form action={createTimeOffRequest} className="mt-5 space-y-4">
        <label className="block text-xs font-semibold">
          Policy
          <select
            name="policy_id"
            required
            className="mt-1 w-full rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2 text-sm"
          >
            {list.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-semibold">
          Starts on
          <input
            type="date"
            name="starts_on"
            required
            className="mt-1 w-full rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-xs font-semibold">
          Ends on
          <input
            type="date"
            name="ends_on"
            required
            className="mt-1 w-full rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-xs font-semibold">
          Hours requested
          <input
            type="number"
            name="hours_requested"
            min="1"
            step="0.5"
            required
            className="mt-1 w-full rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-xs font-semibold">
          Reason
          <textarea
            name="reason"
            rows={3}
            maxLength={1000}
            className="mt-1 w-full rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2 text-sm"
          />
        </label>
        <button type="submit" className="btn btn-primary w-full">
          Submit
        </button>
      </form>
    </div>
  );
}
