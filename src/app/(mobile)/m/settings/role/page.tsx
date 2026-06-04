import { ModuleHeader } from "@/components/Shell";
import { RoleChooser } from "@/components/mobile/RoleChooser";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { MOBILE_ROLES, mapSessionToMobileRole, type MobileRole } from "@/lib/nav";

/**
 * Role chooser (ADR-0009 scaffold).
 *
 * Persists the user's chosen mobile role to
 * `user_preferences.ui_state.mobile_role`. The mobile layout reads it
 * to pick the tab bar (post-execution-PR) and the chrome's "Switch
 * role" entry deep-links here.
 *
 * Pre-fills with `mapSessionToMobileRole(role, persona)` if the user
 * hasn't picked one before. Updating the role refreshes the route.
 */
export const dynamic = "force-dynamic";

export default async function MobileRoleChooserPage() {
  const session = await requireSession();
  let current: MobileRole = mapSessionToMobileRole(session.role, session.persona);
  if (hasSupabase) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("user_preferences")
      .select("ui_state")
      .eq("user_id", session.userId)
      .maybeSingle();
    const uiState = (data?.ui_state as { mobile_role?: MobileRole } | null) ?? null;
    if (uiState?.mobile_role && MOBILE_ROLES.includes(uiState.mobile_role)) {
      current = uiState.mobile_role;
    }
  }
  return (
    <div className="px-4 pt-4 pb-24">
      <ModuleHeader eyebrow="Settings" title="Mobile role" subtitle="Pick the role that matches your job today." />
      <div className="page-content">
        <RoleChooser current={current} roles={MOBILE_ROLES} />
      </div>
    </div>
  );
}
