/**
 * KB article verification status (kit 21 W7, Guru canon). Derives one of three
 * trust states from the verification stamp + review interval — the SSOT for
 * both the list badge and the article header.
 */
export type KbVerification =
  | { state: "unverified" }
  | { state: "verified"; verifiedAt: string }
  | { state: "stale"; verifiedAt: string };

export function kbVerification(
  verifiedAt: string | null,
  reviewIntervalDays: number,
  now: number,
): KbVerification {
  if (!verifiedAt) return { state: "unverified" };
  const ageDays = (now - new Date(verifiedAt).getTime()) / 86_400_000;
  return ageDays > reviewIntervalDays
    ? { state: "stale", verifiedAt }
    : { state: "verified", verifiedAt };
}

/**
 * Verified-only event-sync gate (L-P5 knowledge grounding seam): only a
 * CURRENTLY verified article may be synced into an event's corpus. Stale
 * articles (review interval lapsed) must be re-verified first — the answer at
 * the gate only ever grounds on knowledge someone has vouched for recently.
 */
export function isEventSyncable(verification: KbVerification): boolean {
  return verification.state === "verified";
}
