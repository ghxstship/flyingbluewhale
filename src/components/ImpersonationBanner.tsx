import { getSession } from "@/lib/auth";
import { ImpersonationExitButton } from "./ImpersonationExitButton";

/**
 * Fixed top banner shown while a developer is acting as another user. Renders
 * nothing for ordinary sessions. The "acting as" identity is the live session
 * (the impersonated target); `impersonatedBy` (the real developer) comes from
 * the HMAC-signed cookie, surfaced on the session by `resolveSession`.
 *
 * Server component — the gate is the DB-backed session, never a client value.
 * Only the small Exit affordance is a client island.
 */
export async function ImpersonationBanner() {
  const session = await getSession();
  if (!session?.impersonatedBy) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        top: 0,
        insetInline: 0,
        zIndex: 2147483646,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.75rem",
        padding: "0.375rem 1rem",
        background: "color-mix(in oklab, var(--p-warning) 22%, var(--p-surface))",
        color: "var(--p-warning-text)",
        borderBottom: "1px solid color-mix(in oklab, var(--p-warning) 45%, transparent)",
        fontSize: "0.8125rem",
        fontWeight: 600,
      }}
    >
      <span className="eyebrow" style={{ color: "inherit" }}>
        Acting as
      </span>
      <span>{session.email}</span>
      <span aria-hidden="true">·</span>
      <ImpersonationExitButton />
    </div>
  );
}
