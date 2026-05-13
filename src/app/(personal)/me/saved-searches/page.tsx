import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { createSavedSearchAction, deleteSavedSearchAction } from "./actions";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  kind: string;
  name: string;
  query: Record<string, unknown>;
  alert_email: boolean;
  alert_push: boolean;
  match_count: number;
  last_checked_at: string | null;
};

export default async function Page() {
  if (!hasSupabase) return <div>Configure Supabase.</div>;
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("saved_searches")
    .select("id, kind, name, query, alert_email, alert_push, match_count, last_checked_at")
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as Row[];

  return (
    <div className="space-y-6">
      <header>
        <div className="text-xs font-semibold tracking-wider uppercase text-[var(--text-muted)]">Saved searches</div>
        <h1 className="font-display mt-1 text-3xl">Saved Searches</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Subscriptions across marketplace surfaces. Email + push alerts when new matches drop.
        </p>
      </header>

      <section className="surface-raised p-4">
        <h2 className="text-xs font-semibold tracking-wider uppercase mb-3 text-[var(--text-muted)]">Add subscription</h2>
        <FormShell action={createSavedSearchAction} submitLabel="Save">
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Kind</label>
            <select name="kind" required className="input-base mt-1.5 w-full">
              <option value="gig">Gig</option>
              <option value="rfq">RFQ</option>
              <option value="talent_call">Talent Call</option>
              <option value="talent">Talent</option>
              <option value="crew">Crew</option>
              <option value="vendor">Vendor</option>
            </select>
          </div>
          <Input label="Name" name="name" required placeholder="A1 / Lighting Programmer · FL" />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Query (JSON)</label>
            <textarea
              name="query"
              rows={4}
              maxLength={4000}
              className="input-base mt-1.5 w-full font-mono text-xs"
              placeholder='{"role":"A1","region":"FL"}'
            />
          </div>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="alert_email" /> Email alerts
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="alert_push" /> Push alerts
            </label>
          </div>
        </FormShell>
      </section>

      <section>
        <h2 className="text-xs font-semibold tracking-wider uppercase mb-3 text-[var(--text-muted)]">Active subscriptions</h2>
        {rows.length === 0 ? (
          <div className="surface-raised p-6 text-sm text-[var(--color-text-secondary)]">No saved searches yet.</div>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.id} className="surface-raised flex items-center justify-between p-3 text-sm">
                <div className="flex items-center gap-3">
                  <Badge variant="muted">{r.kind}</Badge>
                  <span className="font-semibold">{r.name}</span>
                  {r.alert_email && <Badge variant="info">email</Badge>}
                  {r.alert_push && <Badge variant="info">push</Badge>}
                  <span className="font-mono text-xs text-[var(--color-text-secondary)]">{r.match_count} matches</span>
                </div>
                <form
                  action={async (fd) => {
                    "use server";
                    await deleteSavedSearchAction(null, fd);
                  }}
                >
                  <input type="hidden" name="search_id" value={r.id} />
                  <button type="submit" className="btn btn-ghost text-xs">
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
