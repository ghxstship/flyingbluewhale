export const dynamic = "force-dynamic";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { createSnapshot } from "./actions";

type Project = { id: string; name: string };

export default async function NewSnapshotPage() {
  if (!hasSupabase) {
    return <div className="px-4 pt-6 pb-24 text-sm">Configure Supabase.</div>;
  }

  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { data: rawProjects } = await supabase
    .from("projects")
    .select("id, name")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(30);

  const projects = (rawProjects ?? []) as Project[];

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--color-brand)] uppercase">Field</div>
      <h1 className="mt-1 text-2xl font-semibold">Capture moment</h1>
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
        Bookmark a key moment during the event. Snapshots are aggregated into the post-event debrief.
      </p>

      <form action={createSnapshot} className="mt-6 space-y-4">
        <label className="block text-xs font-semibold">
          Project
          <select name="project_id" className="input w-full mt-1" required>
            <option value="">Select project…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs font-semibold">
          What happened?
          <input
            name="label"
            type="text"
            className="input w-full mt-1"
            placeholder="e.g. Headliner walked on stage at 9:47 PM"
            required
            maxLength={200}
          />
        </label>

        <label className="block text-xs font-semibold">
          Details (optional)
          <textarea
            name="body"
            className="input w-full mt-1"
            rows={3}
            placeholder="Add context, issues, or notes…"
            maxLength={2000}
          />
        </label>

        <button type="submit" className="btn-primary w-full py-3 rounded-xl font-semibold text-sm">
          Save snapshot
        </button>
      </form>
    </div>
  );
}
