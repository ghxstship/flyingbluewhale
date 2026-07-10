"use server";

import { redirect } from "next/navigation";
import { consumeShareLink } from "@/lib/share/links";
import { resolveResourceUrl } from "./resolve";

/**
 * Server action for the passcode form.
 *
 * Calls `consumeShareLink` with the supplied passcode. On success the link
 * has been atomically claimed — we redirect straight to the resource's
 * destination URL (or the inline placeholder route, depending on the
 * resource type). On failure the form re-renders with the error.
 *
 * Caveat: the passcode submission consumes a use. That's intentional — it
 * matches the spec ("only successful resource access increments"); a wrong
 * passcode does NOT increment because `consumeShareLink` short-circuits
 * before the RPC call.
 */

export type PasscodeFormState = { error?: string } | null;

export async function submitPasscode(prev: PasscodeFormState, fd: FormData): Promise<PasscodeFormState> {
  const token = String(fd.get("token") ?? "");
  const passcode = String(fd.get("passcode") ?? "");
  if (!token) return { error: "Missing token" };
  if (!passcode) return { error: "Enter the passcode to continue" };

  const result = await consumeShareLink({ token, passcode });
  if (!result.ok) {
    if (result.reason === "passcode_wrong") return { error: "Wrong passcode — try again" };
    if (result.reason === "passcode_required") return { error: "Passcode required" };
    if (result.reason === "expired") return { error: "This link has expired" };
    if (result.reason === "revoked") return { error: "This link has been revoked" };
    if (result.reason === "exhausted") return { error: "This link has reached its use limit" };
    return { error: "Link not valid" };
  }

  // Successful claim — bounce back to /share/[token]?unlocked=1; the page
  // dispatches to the resource's read-only renderer (proposal document,
  // guide view, or the honest summary card) without consuming a second use.
  const dest = resolveResourceUrl(result.resource.table, result.resource.id, token);
  redirect(dest);
}
