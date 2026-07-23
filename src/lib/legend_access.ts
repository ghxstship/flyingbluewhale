/**
 * LEG3ND write-access floor (PERSONA_MATRIX finding P-1, L-P6d).
 *
 * The entitlements contract (`src/lib/entitlements.json` PERSONA_REACH +
 * `productAccess` in `src/lib/entitlements.ts`) gives the read-only
 * stakeholder personas at most `ro` reach into LEG3ND, and the Persona
 * docblock (`src/lib/supabase/types.ts`) declares them write-less:
 *
 *   client    — proposal recipient / portal viewer (read-only)
 *   viewer    — generic read-only stakeholder
 *   community — public marketplace browser; no write capabilities
 *
 * RLS deliberately does NOT enforce this: learner writes are
 * membership-banded (`is_org_member` + self-id, locked by
 * `src/lib/legend-learner-rls-canon.test.ts`) because "the learner is any
 * org member". The persona contract is therefore enforced HERE, at the
 * action boundary: every legend write action that admits the learner band
 * calls `assertLegendWrite(session)` before touching the DB. Manager-gated
 * actions don't need it — `isManagerPlus` already excludes these personas.
 *
 * Guarded by `src/lib/legend-persona-gating.test.ts` (every legend write
 * action carries a manager gate or this assert).
 */
import type { Session } from "@/lib/auth";
import type { Persona } from "@/lib/supabase/types";
import { actionError } from "@/lib/errors";

/** Personas whose LEG3ND reach is read-only (entitlements `ro`). */
export const LEGEND_READ_ONLY_PERSONAS: readonly Persona[] = ["viewer", "client", "community"] as const;

/** True when the session's persona is a read-only stakeholder. */
export function isLegendReadOnly(session: Pick<Session, "persona"> | null): boolean {
  return !!session && (LEGEND_READ_ONLY_PERSONAS as readonly string[]).includes(session.persona);
}

/**
 * Learner-write gate. Returns the canonical read-only denial `{ error }`
 * payload (an i18n `actionError` sentinel) when the caller's persona is
 * read-only, or `null` when the write may proceed.
 *
 *   const denied = assertLegendWrite(session);
 *   if (denied) return denied;            // State-shaped actions
 *   if (denied) throw new Error(denied.error); // void actions
 */
export function assertLegendWrite(session: Pick<Session, "persona">): { error: string } | null {
  if (isLegendReadOnly(session)) {
    return actionError(
      "auth.read-only.legend",
      "Your access is read-only. Ask an org admin for member access to participate.",
    );
  }
  return null;
}
