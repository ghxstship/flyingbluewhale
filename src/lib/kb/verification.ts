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
