import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { KIcon } from "@/components/mobile/kit";
import { AccountActions } from "./AccountActions";

export const dynamic = "force-dynamic";

/**
 * /m/settings/account — the COMPVSS account lifecycle screen (pause / archive),
 * linked from /m/settings. Pause is reversible (hides from scheduling/rosters,
 * mutes notifications); Archive is a self-serve REQUEST that preserves records
 * and anonymizes the profile — an admin completes the access revoke.
 *
 * State lives on `user_preferences.ui_state.account` (no `account_state`
 * column). See ./actions.ts for the full contract.
 *
 * Design truth: kit auth.jsx — the account / pause / archive screens.
 */

type AccountUiState = {
  paused?: boolean;
  paused_at?: string;
  archive_requested_at?: string;
};

export default async function MobileAccountPage() {
  const { t } = await getRequestT();

  if (!hasSupabase) {
    return (
      <div className="screen screen-anim">
        <div className="scr-eye">{t("m.account.eyebrow", undefined, "Account Status")}</div>
        <h1 className="scr-h">{t("m.account.title", undefined, "Account")}</h1>
        <p className="form-intro">{t("common.configureSupabase", undefined, "Configure Supabase.")}</p>
      </div>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();

  const [{ data: user }, { data: prefs }] = await Promise.all([
    supabase.from("users").select("name, email").eq("id", session.userId).maybeSingle(),
    supabase.from("user_preferences").select("ui_state").eq("user_id", session.userId).maybeSingle(),
  ]);

  const u = (user as { name: string | null; email: string } | null) ?? null;
  const ui = (prefs?.ui_state as Record<string, unknown> | null) ?? {};
  const account = ((ui.account as AccountUiState | undefined) ?? {}) as AccountUiState;

  const name = u?.name ?? session.email ?? "";
  const email = u?.email ?? session.email ?? "";
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?";

  return (
    <div className="screen screen-anim">
      <a className="backbtn" href="/m/settings">
        <KIcon name="ChevronLeft" size={17} /> {t("m.settings.title", undefined, "Settings")}
      </a>
      <div className="scr-eye">{t("m.account.eyebrow", undefined, "Account Status")}</div>
      <h1 className="scr-h" style={{ marginBottom: 8 }}>
        {t("m.account.title", undefined, "Account")}
      </h1>
      <p className="form-intro">
        {t("m.account.intro", undefined, "Manage your account status — step away for a while or request archival.")}
      </p>

      {/* ── Identity summary ── */}
      <div className="item">
        <span
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            background: "var(--p-accent)",
            color: "var(--p-accent-cta-contrast)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--p-mono)",
            fontWeight: 700,
            flex: "none",
          }}
        >
          {initials}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t">{name}</div>
          <div className="s">{email}</div>
        </div>
      </div>

      <AccountActions
        initialPaused={account.paused === true}
        initialArchiveRequested={typeof account.archive_requested_at === "string"}
      />
    </div>
  );
}
