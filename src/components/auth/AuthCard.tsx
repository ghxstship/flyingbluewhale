"use client";

import type { ReactNode } from "react";

/**
 * AuthCard — the canonical centered auth surface (design-system canon,
 * `kits/core/components/access/AuthCard`). One primitive for sign-in/up, reset,
 * verify, and accept-invite across every product surface; consumer/field
 * surfaces diverge in copy + flow but compose THIS, never a fork (see
 * guidelines/atlvs-kit-coherence-audit.md → "Canon: authentication & onboarding").
 *
 * Presentational + interactive: it renders the brand, title, SSO providers, an
 * optional divider, the form fields (children), and a footer switch link.
 * Token-only colors.
 */
export type AuthProvider = { id: string; label: ReactNode; icon?: string };

export function AuthCard({
  brand,
  title,
  subtitle,
  providers,
  onProvider,
  children,
  footer,
  dividerLabel = "or continue with email",
  renderIcon,
  className = "",
}: {
  brand?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  providers?: AuthProvider[];
  onProvider?: (id: string) => void;
  children?: ReactNode;
  footer?: ReactNode;
  dividerLabel?: ReactNode;
  renderIcon?: (name?: string) => ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-sm ${className}`}>
      {brand && <div className="mb-6">{brand}</div>}
      {title && <h1 className="text-[length:var(--p-fs-h2)]">{title}</h1>}
      {subtitle && <p className="mt-2 text-sm text-[var(--p-text-2)]">{subtitle}</p>}

      {providers && providers.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {providers.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onProvider?.(p.id)}
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-[var(--p-border)] bg-[var(--p-surface)] px-3 py-2 text-xs font-medium text-[var(--p-text-1)] transition-colors hover:bg-[var(--p-surface-2)]"
            >
              {renderIcon?.(p.icon)}
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      )}

      {providers && providers.length > 0 && children && (
        <div className="my-5 flex items-center gap-3 text-[11px] tracking-[0.2em] text-[var(--p-text-2)] uppercase">
          <div className="h-px flex-1 bg-[var(--p-border)]" />
          <span>{dividerLabel}</span>
          <div className="h-px flex-1 bg-[var(--p-border)]" />
        </div>
      )}

      {children && <div className={providers && providers.length > 0 ? "" : "mt-6"}>{children}</div>}
      {footer && <div className="mt-6 text-center text-xs text-[var(--p-text-2)]">{footer}</div>}
    </div>
  );
}
