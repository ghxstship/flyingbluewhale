import "server-only";
import { createServiceClient, isServiceClientAvailable } from "./supabase/server";
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
  | "auth.delete_cancelled"
  | "auth.org.switched"
  | "auth.mfa.enabled"
  | "auth.mfa.disabled"
  // Role + membership lifecycle. `auth.role.changed` is the most
  // security-sensitive write in the console — it grants or revokes
  // platform-level capabilities. Always log it.
  | "auth.role.changed"
  | "auth.member.removed"
  | "auth.member.restored"
  | "auth.invite.created"
  | "auth.invite.revoked"
  | "auth.invite.accepted"
  // Project membership lifecycle.
  | "auth.project_member.added"
  | "auth.project_member.role_changed"
  | "auth.project_member.removed"
  // API keys (PATs).
  | "auth.api_key.minted"
  | "auth.api_key.revoked"
  // Developer "Act As" impersonation + sandbox-user lifecycle. The most
  // sensitive operator action set — each start/stop/spawn/cull is audited
  // with actor (the developer) + target.
  | "impersonate.start"
  | "impersonate.stop"
  | "impersonate.sandbox_spawn"
  | "impersonate.sandbox_cull"
  // Org-level admin config that changes auth posture.
  | "auth.sso.upserted"
  | "auth.sso.deleted"
  | "auth.org_role.created"
  | "auth.org_role.deleted"
  | "auth.rate_limit.set"
  | "auth.rate_limit.cleared"
  // Proposal share links (public surface) — minting + revoking these
  // grants and removes anon access to a proposal document.
  | "auth.proposal_share.created"
  | "auth.proposal_share.revoked"
  // Generic share-link surface (post-audit drift fix). Any anon-reach
  // surface — proposals, decks, drawings — should emit one of these.
  | "share_link.create"
  | "share_link.revoke"
  // MFA recovery code rotation. Recovery codes are sensitive material;
  // when they're regenerated the prior batch is hard-deleted (no soft
  // delete — leaves redeemable secrets findable). The audit row is the
  // forensic trail.
  | "auth.mfa.recovery_codes_regenerated"
  // Advancing state-machine transitions — driven by
  // POST /api/v1/deliverables/:id/transition
  | "deliverable.in_review"
  | "deliverable.approved"
  | "deliverable.rejected"
  | "deliverable.revision_requested"
  | "deliverable.fulfilled"
  // ────────────────────────────────────────────────────────────────
  // XPMS / finance (migrations 0070-0073)
  // ────────────────────────────────────────────────────────────────
  | "budget.created"
  | "budget.updated"
  | "budget.deleted"
  | "budget.reconciled"
  | "budget.imported"
  | "expense.created"
  | "expense.updated"
  | "expense.deleted"
  | "expense.approved"
  | "expense.reimbursed"
  | "expense.rejected"
  | "draw.created"
  | "draw.updated"
  | "draw.deleted"
  | "draw.marked_drawn"
  | "draw.marked_pending"
  | "draw.seeded_default"
  // ────────────────────────────────────────────────────────────────
  // Workforce parity (migrations 0046–0048, 0050–0051)
  // ────────────────────────────────────────────────────────────────
  | "announcement.published"
  | "announcement.read"
  | "kudos.created"
  | "kudos.reaction.toggled"
  | "badge.awarded"
  | "badge.revoked"
  | "course.assigned"
  | "course.completed"
  | "time_off.requested"
  | "time_off.approved"
  | "time_off.denied"
  | "time_off.cancelled"
  | "shift_swap.requested"
  | "shift_swap.accepted"
  | "shift_swap.declined"
  | "incident.filed"
  | "onboarding.assigned"
  | "onboarding.completed"
  | "personal_document.uploaded"
  | "personal_document.deleted"
  // ────────────────────────────────────────────────────────────────
  // Accreditation + workforce
  // ────────────────────────────────────────────────────────────────
  | "credential.assigned"
  | "credential.revoked"
  | "accreditation.scan"
  // ────────────────────────────────────────────────────────────────
  // Notification matrix (migration 0069)
  // ────────────────────────────────────────────────────────────────
  | "notification.read"
  | "notification.preferences_updated"
  // ────────────────────────────────────────────────────────────────
  // Privacy / GDPR — DSAR + data-export surfaces. These are the events
  // most likely to be litigated (Art. 15 access, Art. 17 erasure,
  // Art. 20 portability), so each create/fulfil/export is audited with
  // actor + target.
  // ────────────────────────────────────────────────────────────────
  | "privacy.dsar.created"
  | "privacy.dsar.fulfilled"
  | "privacy.data_export"
  | "privacy.audit_export"
  // ────────────────────────────────────────────────────────────────
  // Marketplace
  // ────────────────────────────────────────────────────────────────
  | "talent_offer.sent"
  | "talent_offer.accepted"
  | "talent_offer.declined"
  | "talent_offer.countersigned"
  | "review.created"
  | "review.released"
  | "job_application.submitted"
  | "open_call_submission.submitted"
  // ────────────────────────────────────────────────────────────────
  // AI
  // ────────────────────────────────────────────────────────────────
  | "copilot.answered"
  // ────────────────────────────────────────────────────────────────
  // v7.8 record actions — loop-closing conversions. Each one creates
  // the downstream record pre-filled from the source and patches the
  // source; the audit row is the cross-record lineage trail (the
  // destination table's own trigger, where present, only sees the
  // insert — not what it was derived from).
  // ────────────────────────────────────────────────────────────────
  | "estimate.converted_to_budget"
  | "incident.corrective_task_created"
  | "requisition.converted_to_po"
  | "requisition.converted_to_rfq"
  | "rfq.awarded_po_drafted"
  | "reservation.event_created"
  // v7.8 Phase B completion (kit 20 REPO_LANDING §2)
  | "purchase_order.routed_to_approvals"
  | "po_change_order.routed_to_approvals"
  | "lead.proposal_created"
  | "asset.checked_out"
  | "asset.checked_in"
  | "asset.state_changed"
  | "submission.offer_created"
  // Receiving → 3-way match. As of the Phase A sub_invoices merge the
  // action rides the match_receipt_three_way RPC, which cross-patches the
  // PO and the linked invoice in one transaction; this row is the
  // operator-attributed lineage on top of it.
  | "goods_receipt.matched_to_po";

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

/**
 * P3 hardening — auto-resolve request_id from next/headers when the
 * caller didn't pass one. proxy.ts mints x-request-id on every request
 * and propagates it through the response; Server Components and Server
 * Actions can read it back via headers(). This avoids threading the id
 * through every call site while still correlating every audit row to a
 * single user-visible HTTP request.
 */
async function resolveRequestId(explicit: string | null | undefined): Promise<string | null> {
  if (explicit) return explicit;
  try {
    const { headers } = await import("next/headers");
    const hs = await headers();
    return hs.get("x-request-id");
  } catch {
    // headers() throws outside a request scope (cron/queue/worker).
    // No request to correlate; emit with null.
    return null;
  }
}

export async function emitAudit(input: AuditInput): Promise<void> {
  const requestId = await resolveRequestId(input.requestId);
  // audit_log is a VIEW over audit_events; RLS on the underlying table
  // restricts inserts to postgres / service_role. Without
  // SUPABASE_SERVICE_ROLE_KEY we have no way to persist the row — the
  // session client would always RLS-reject. Skip silently in that case
  // (typical local dev) so the log isn't flooded with warns that the
  // operator can't action. A single debug-level note still drops in
  // case anyone is following the trace.
  if (!isServiceClientAvailable()) {
    log.debug("audit.emit.skipped", {
      action: input.action,
      reason: "no_service_role_key",
      request_id: requestId ?? undefined,
    });
    return;
  }

  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("audit_log").insert({
      actor_id: input.actorId,
      org_id: input.orgId,
      actor_email: input.actorEmail ?? null,
      action: input.action,
      target_table: input.targetTable ?? null,
      target_id: input.targetId ?? null,
      metadata: (input.metadata ?? {}) as never,
      request_id: requestId,
      operation: "EMIT",
    });
    if (error) {
      // With service-role configured, an RLS or constraint failure here
      // is a real signal — the audit pipeline is broken.
      log.warn("audit.emit.failed", {
        action: input.action,
        err: error.message,
        request_id: requestId ?? undefined,
      });
    }
  } catch (err) {
    log.warn("audit.emit.failed", {
      action: input.action,
      err: err instanceof Error ? err.message : String(err),
      request_id: requestId ?? undefined,
    });
  }
}
