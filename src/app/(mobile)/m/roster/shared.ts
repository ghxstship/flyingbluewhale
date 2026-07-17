import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getOfferLetter } from "@/lib/offer-letters/queries";
import type { OfferLetter, OfferLetterResolved } from "@/lib/offer-letters/types";

/**
 * Kit 30 · /m/roster shared server helpers.
 *
 * The mobile roster is scoped to the ACTIVE project — the same resolution the
 * app-bar project switcher uses (src/app/(mobile)/layout.tsx: the most
 * recently started project whose project_state = 'active'). One helper so the
 * six roster screens and the app-bar context row can never disagree about
 * which world the manager is looking at.
 */

export type ActiveProject = {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
};

export async function resolveActiveProject(orgId: string): Promise<ActiveProject | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id, name, start_date, end_date")
    .eq("org_id", orgId)
    .eq("project_state", "active")
    .is("deleted_at", null)
    .order("start_date", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    name: data.name ?? "Untitled Project",
    start_date: data.start_date ?? null,
    end_date: data.end_date ?? null,
  };
}

/** Org-checked engagement read — the [engagementId] pages all start here. */
export async function getOrgLetter(
  orgId: string,
  engagementId: string,
): Promise<{ raw: OfferLetter; resolved: OfferLetterResolved } | null> {
  return getOfferLetter(orgId, engagementId);
}

/**
 * letter_state → ps-badge tone for the mobile kit. Mirrors the full 11-value
 * enum (offer_letter_status grew COUNTERSIGNED/ACTIVE/SUPERSEDED/VOIDED after
 * the shared STATUS_VARIANT map was written; the console roster carries the
 * same complete map in its page-local letter-state.ts).
 */
export const LETTER_STATE_TONE: Record<string, string> = {
  draft: "neutral",
  sent: "info",
  viewed: "info",
  accepted: "ok",
  countersigned: "ok",
  active: "ok",
  declined: "danger",
  withdrawn: "neutral",
  expired: "neutral",
  superseded: "neutral",
  voided: "neutral",
};

/** Letters that still represent a live engagement on the project. */
export const LIVE_LETTER_STATES = ["draft", "sent", "viewed", "accepted", "countersigned", "active"] as const;

/** "JS" for "Jack Sparrow" — kit avatar initials. */
export function initialsFor(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const out = parts.map((p) => p.charAt(0).toUpperCase()).join("");
  return out || "?";
}
