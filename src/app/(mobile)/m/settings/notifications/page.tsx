import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { savePreferences } from "./actions";

export const dynamic = "force-dynamic";

/**
 * /m/settings/notifications — per-kind notification toggles.
 *
 * Reads the `notification_kind_catalog` view (migration 0051) for the
 * canonical event-kind list and merges it with the caller's matrix from
 * `notification_preferences`. Default for unset kinds: enabled. Storage
 * shape is a flat jsonb map `{ kind: { push: bool, email: bool } }`.
 */

type Kind = { kind: string; label: string; description: string };
type Matrix = Record<string, { push?: boolean; email?: boolean }>;

export default async function NotifPrefsPage() {
  if (!hasSupabase) return <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">Configure Supabase.</div>;
  const session = await requireSession();
  const supabase = await createClient();

  const [{ data: kinds }, { data: prefs }] = await Promise.all([
    supabase.from("notification_kind_catalog").select("kind, label, description").order("kind"),
    supabase.from("notification_preferences").select("matrix, digest").eq("user_id", session.userId).maybeSingle(),
  ]);

  const kindList = (kinds ?? []) as Kind[];
  const matrix = ((prefs as { matrix?: Matrix } | null)?.matrix ?? {}) as Matrix;
  const digest = (prefs as { digest?: string } | null)?.digest ?? "immediate";

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">Settings</div>
      <h1 className="mt-1 text-2xl font-semibold">Notifications</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Choose which event kinds reach you over push and email. The push channel only fires when you&apos;ve also
        enabled push subscriptions on{" "}
        <a className="underline" href="/m/settings">
          Settings → Push Notifications
        </a>
        .
      </p>

      <form action={savePreferences} className="mt-5 space-y-4">
        <div className="surface p-4">
          <h2 className="text-sm font-semibold">Digest</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            How often to batch quieter events instead of pinging immediately.
          </p>
          <select name="digest" defaultValue={digest} className="input-base mt-3 w-full">
            <option value="immediate">Immediate</option>
            <option value="hourly">Hourly digest</option>
            <option value="daily">Daily digest</option>
          </select>
        </div>

        <div className="surface p-4">
          <h2 className="text-sm font-semibold">Per-Kind Toggles</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Default is on. Turn off the noise you don&apos;t want.
          </p>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] tracking-wider text-[var(--text-muted)] uppercase">
                <th className="pb-2">Kind</th>
                <th className="pb-2 text-center">Push</th>
                <th className="pb-2 text-center">Email</th>
              </tr>
            </thead>
            <tbody>
              {kindList.map((k) => {
                const cell = matrix[k.kind] ?? {};
                const pushOn = cell.push !== false;
                const emailOn = cell.email !== false;
                return (
                  <tr key={k.kind} className="border-t border-[var(--border-color)]">
                    <td className="py-3">
                      <div className="text-sm font-semibold">{k.label}</div>
                      <div className="text-xs text-[var(--text-muted)]">{k.description}</div>
                    </td>
                    <td className="text-center align-middle">
                      <input type="checkbox" name={`push_${k.kind}`} defaultChecked={pushOn} className="h-4 w-4" />
                    </td>
                    <td className="text-center align-middle">
                      <input type="checkbox" name={`email_${k.kind}`} defaultChecked={emailOn} className="h-4 w-4" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <button type="submit" className="btn btn-primary w-full">
          Save Preferences
        </button>
      </form>
    </div>
  );
}
