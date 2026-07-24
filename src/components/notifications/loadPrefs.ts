import "server-only";

import { createClient } from "@/lib/supabase/server";
import { NOTIF_KINDS, NOTIF_KIND_FALLBACKS, type NotifKind, type NotifKindRow } from "./kinds";

export type NotifPrefsData = {
  /** Catalog rows in canonical kind order. */
  kinds: NotifKindRow[];
  /** `kind → push enabled` — default-on: only an explicit `push:false`
   *  in `notification_preferences.matrix` disables (matches the
   *  `filterByPushPrefs` gate in src/lib/push/send.ts). */
  pushEnabled: Record<NotifKind, boolean>;
  /** `kind → email cell` (tri-state rendered as a checkbox). The email
   *  channel has two gates with different defaults — fanOutEmail
   *  (push-path, missing cell = OFF) and notify-resolver (notify() events,
   *  missing cell = ON) — but an EXPLICIT cell wins in both, so this
   *  switch is real either way. Rendered checked only on explicit true,
   *  matching the opt-in posture of the push-path gate. */
  emailEnabled: Record<NotifKind, boolean>;
};

/**
 * Read the caller's real notification-preference state: the
 * `notification_kind_catalog` taxonomy joined against
 * `notification_preferences.matrix`. Shared by /me/notifications and the
 * portal notification-settings page so every surface shows the same truth
 * the push fan-out enforces.
 */
export async function loadNotifPrefs(userId: string): Promise<NotifPrefsData> {
  const supabase = await createClient();
  const [{ data: catalog }, { data: prefs }] = await Promise.all([
    supabase.from("notification_kind_catalog").select("kind, label, description"),
    supabase.from("notification_preferences").select("matrix").eq("user_id", userId).maybeSingle(),
  ]);

  // The VALUES-view row order isn't guaranteed — sort by canonical order and
  // drop any kind the app's delivery gate doesn't know about.
  const byKind = new Map(
    ((catalog ?? []) as Array<{ kind: string; label: string | null; description: string | null }>).map((r) => [
      r.kind,
      r,
    ]),
  );
  const kinds: NotifKindRow[] = NOTIF_KINDS.map((kind) => {
    const row = byKind.get(kind);
    const fallback = NOTIF_KIND_FALLBACKS.find((f) => f.kind === kind)!;
    return {
      kind,
      label: row?.label ?? fallback.label,
      description: row?.description ?? fallback.description,
    };
  });

  const matrix = (prefs?.matrix as Record<string, { push?: boolean; email?: boolean }> | null) ?? {};
  const pushEnabled = Object.fromEntries(
    NOTIF_KINDS.map((kind) => [kind, matrix[kind]?.push !== false]),
  ) as Record<NotifKind, boolean>;
  const emailEnabled = Object.fromEntries(
    NOTIF_KINDS.map((kind) => [kind, matrix[kind]?.email === true]),
  ) as Record<NotifKind, boolean>;

  return { kinds, pushEnabled, emailEnabled };
}
