"use client";

import { useActionState } from "react";
import Link from "next/link";
import { KIcon } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";
import { PLATFORM_ROLES } from "@/lib/supabase/types";
import { createInviteAction } from "@/app/(platform)/studio/people/invites/actions";

/**
 * COMPVSS · Invite Someone.
 *
 * The scenario this exists for: a contractor turns up at the gate who
 * isn't in the system, and the only person who can add them is standing
 * next to them holding a phone. Until now that required finding a laptop.
 *
 * Calls the console's `createInviteAction` unchanged. That action carries
 * the isAdmin gate, the cross-org project guard, the duplicate-invite
 * handling, the module-scope rules and the invitation email — none of
 * which should exist twice. The field deliberately sends the SIMPLE case
 * (email + role, org-wide, default expiry): project scoping, subcontractor
 * module scope and time-boxed seats are deskwork, and omitting those form
 * fields makes the action take its own defaults rather than mobile
 * inventing parallel ones.
 */
export default function InvitePage() {
  const t = useT();
  const [state, formAction, pending] = useActionState(createInviteAction, null);

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.team.invite.eyebrow", undefined, "Team")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        Invite Someone
      </h1>

      {state?.error && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 12 }}>
          {state.error}
        </div>
      )}

      <form action={formAction}>
        <div className="fld">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            inputMode="email"
            autoCapitalize="off"
            autoCorrect="off"
            placeholder="them@example.com"
            defaultValue={state?.values?.email ?? ""}
          />
          {state?.fieldErrors?.email && <div className="hint">{state.fieldErrors.email}</div>}
        </div>

        <div className="fld">
          <label htmlFor="role">Role</label>
          <select id="role" name="role" defaultValue={state?.values?.role ?? "member"}>
            {PLATFORM_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <div className="hint">
            Most people are a member. Managers can approve; admins can invite and change roles.
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <Link
            href="/m/settings/team"
            className="ps-btn ps-btn--tertiary ps-btn--lg"
            style={{ flex: 1, justifyContent: "center" }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="ps-btn ps-btn--cta ps-btn--lg"
            style={{ flex: 2, justifyContent: "center" }}
            disabled={pending}
          >
            <KIcon name="Send" size={15} /> {pending ? "Sending…" : "Send Invite"}
          </button>
        </div>
      </form>
    </div>
  );
}
