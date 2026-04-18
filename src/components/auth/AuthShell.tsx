"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Sparkles, ShieldCheck, Zap, Globe } from "lucide-react";

const HIGHLIGHTS = [
  { icon: ShieldCheck, label: "RLS-backed multi-tenant security" },
  { icon: Zap, label: "Sub-100ms ticket scans, online and offline" },
  { icon: Globe, label: "Streaming AI grounded in your workspace" },
  { icon: Sparkles, label: "One platform · ATLVS · GVTEWAY · COMPVSS" },
];

/**
 * Split-layout auth shell — marketing rail on the left, form on the right.
 * Collapses to single column on mobile.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-72px)] grid lg:grid-cols-2">
      {/* Left rail */}
      <aside
        aria-hidden="true"
        className="hidden lg:flex flex-col justify-between bg-[var(--surface-inset)] p-12"
        data-platform="atlvs"
      >
        <Link href="/" className="text-base font-semibold tracking-tight">
          flyingbluewhale
        </Link>
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">
            The unified production platform.
          </h2>
          <p className="mt-3 max-w-md text-sm text-[var(--text-secondary)]">
            One Postgres. One identity. Three shells — internal, external, mobile.
            Built for the ops teams behind festivals, tours, and corporate activations.
          </p>
          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <Icon size={14} className="text-[var(--org-primary)]" />
                {label}
              </li>
            ))}
          </ul>
        </div>
        <div className="text-xs text-[var(--text-muted)]">
          © {new Date().getFullYear()} GHXSTSHIP
        </div>
      </aside>

      {/* Form pane */}
      <main className="flex items-center justify-center px-6 py-12 sm:py-16">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{subtitle}</p>
          )}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-center text-xs text-[var(--text-muted)]">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
