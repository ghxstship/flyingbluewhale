import "server-only";
import { createClient } from "./supabase/server";
import { log } from "./log";

/**
 * Emit a row into `public.audit_log` for a privileged auth/account action.
 * H2-07 / IK-046.
 *
 * Tables that mutate through the SSOT audit trigger (projects, memberships,
 * user_preferences, etc.) already get an audit row for free. This helper is
 * for actions whose primary effect lives OUTSIDE our public schema — the
 * canonical case is an auth event (login, logout, passkey registered, etc)
 * where the underlying state change is in `auth.users` / `user_passkeys`.
 *
 * Silent-failure policy: an audit miss must not block the action that
 * triggered it. We log-warn and return so the caller can continue. Repeat
 * failures are alertable via the `audit.emit.failed` log event.
 */

export type AuditAction =
  | "auth.login"
  | "auth.logout"
  | "auth.passkey.registered"
  | "auth.passkey.revoked"
  | "auth.password.reset_requested"
  | "auth.delete_requested"
  | "auth.org.switched"
  | "auth.mfa.enabled"
  | "auth.mfa.disabled";

export type AuditInput = {
  /** Actor's user id (auth.users.id). */
  actorId: string;
  /** Actor's org (audit_log is org-scoped under RLS). */
  orgId: string;
  /** Actor's email — denormalized for audit readability. */
  actorEmail?: string | null;
  action: AuditAction;
  /** Optional target (e.g. `user_passkeys` + the credential id). */
  targetTable?: string | null;
  targetId?: string | null;
  /** Free-form additional context. Sensitive fields MUST be omitted. */
  metadata?: Record<string, unknown>;
  /** Request correlation id — propagate from x-request-id when available. */
  requestId?: string | null;
};

export async function emitAudit(input: AuditInput): Promise<void> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("audit_log").insert({
      actor_id: input.actorId,
      org_id: input.orgId,
      actor_email: input.actorEmail ?? null,
      action: input.action,
      target_table: input.targetTable ?? null,
      target_id: input.targetId ?? null,
      metadata: (input.metadata ?? {}) as never,
      request_id: input.requestId ?? null,
      operation: "EMIT",
    });
    if (error) {
      log.warn("audit.emit.failed", {
        action: input.action,
        err: error.message,
        request_id: input.requestId ?? undefined,
      });
    }
  } catch (err) {
    log.warn("audit.emit.failed", {
      action: input.action,
      err: err instanceof Error ? err.message : String(err),
      request_id: input.requestId ?? undefined,
    });
  }
}
