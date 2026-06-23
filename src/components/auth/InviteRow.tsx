"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";

/**
 * InviteRow — the canonical team-invite list row (design-system canon,
 * `kits/core/components/access/InviteRow`): email · status · role picker ·
 * resend/revoke. One primitive for every invite surface (operator team admin,
 * portal collaborator invites). Per guidelines/atlvs-kit-coherence-audit.md.
 *
 * Token-only colors.
 */
const STATUS_VARIANT = { pending: "warning", active: "success", expired: "muted" } as const;

export function InviteRow({
  email,
  role,
  status = "pending",
  roles,
  onRole,
  onResend,
  onRevoke,
  renderIcon,
  className = "",
}: {
  email: ReactNode;
  role?: string;
  status?: "pending" | "active" | "expired";
  roles?: string[];
  onRole?: (role: string) => void;
  onResend?: () => void;
  onRevoke?: () => void;
  renderIcon?: (name?: string) => ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`surface flex flex-wrap items-center gap-3 rounded-[var(--p-r-md)] p-3 ${className}`}
    >
      {renderIcon?.("mail")}
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--p-text-1)]">{email}</span>
      <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>

      {roles && roles.length > 0 ? (
        <select
          aria-label="Role"
          value={role}
          onChange={(e) => onRole?.(e.currentTarget.value)}
          className="ps-input ps-input--sm w-auto"
        >
          {roles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      ) : (
        role && <span className="text-xs text-[var(--p-text-2)]">{role}</span>
      )}

      {onResend && (
        <button
          type="button"
          onClick={onResend}
          className="focus-ring text-xs font-medium text-[var(--p-accent-text)] hover:underline"
        >
          Resend
        </button>
      )}
      {onRevoke && (
        <button
          type="button"
          onClick={onRevoke}
          className="focus-ring text-xs font-medium text-[var(--p-danger)] hover:underline"
        >
          Revoke
        </button>
      )}
    </div>
  );
}
