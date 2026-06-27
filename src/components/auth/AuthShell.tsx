"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Sparkles, ShieldCheck, Zap, Globe } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";

export type AuthRailContent = {
  productName?: string;
  tagline?: string;
  description?: string;
  logoUrl?: string;
  highlights?: Array<{ icon?: React.ComponentType<{ size?: number; className?: string }>; label: string }>;
  copyright?: string;
};

const DEFAULT_HIGHLIGHTS = [
  { icon: ShieldCheck, label: "RLS-backed multi-tenant security" },
  { icon: Zap, label: "Sub-100ms ticket scans, online and offline" },
  { icon: Globe, label: "Streaming AI grounded in your workspace" },
  { icon: Sparkles, label: "One ecosystem · ATLVS · COMPVSS · GVTEWAY · LEG3ND" },
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
  rail,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** White-label rail content (driven by orgs.branding for tenant deployments). */
  rail?: AuthRailContent;
}) {
  const productName = rail?.productName ?? "ATLVS Technologies";
  const tagline = rail?.tagline ?? "The engine behind new worlds.";
  const description =
    rail?.description ??
    "Develop, build, operate, and experience live productions on one platform. One record store, four connected apps — ATLVS, COMPVSS, GVTEWAY, LEG3ND. Built by the people who ship the shows.";
  const highlights = rail?.highlights ?? DEFAULT_HIGHLIGHTS;
  const copyright = rail?.copyright ?? `© ${new Date().getFullYear()} ATLVS Technologies`;
  return (
    <div className="grid min-h-[calc(100vh-72px)] lg:grid-cols-2">
      <aside
        aria-label={`About ${productName}`}
        className="hidden flex-col justify-between bg-[var(--p-surface-2)] p-12 lg:flex"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-base font-semibold tracking-tight"
          aria-label={productName}
        >
          {rail?.logoUrl ? (
            // White-label tenant override.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={rail.logoUrl} alt="" className="h-6 w-auto" />
          ) : (
            // Default — canonical ATLVS Waypoint mark per
            // ui_kits/atlvs/logo-kit.html "Primary Lockup". The auth
            // screens are the first product touch and carry the full
            // lockup, not just text.
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/brand/atlvs-mark.svg" alt="" width={22} height={22} aria-hidden="true" />
          )}
          {rail?.productName ? (
            <span>{rail.productName}</span>
          ) : (
            // Default — the canonical ATLVS Jost wordmark completes the lockup
            // (mark + wordmark). White-label tenants keep their plain productName.
            <Wordmark word="ATLVS" style={{ fontSize: 16, fontWeight: 500 }} />
          )}
        </Link>
        <div>
          <h2 className="hed-xl">{tagline}</h2>
          <p className="mt-3 max-w-md text-sm text-[var(--p-text-2)]">{description}</p>
          <ul className="mt-8 space-y-3">
            {highlights.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-xs text-[var(--p-text-2)]">
                {Icon ? <Icon size={14} className="text-[var(--p-accent)]" /> : null}
                {label}
              </li>
            ))}
          </ul>
        </div>
        <div className="text-xs text-[var(--p-text-2)]">{copyright}</div>
      </aside>

      {/* Form pane */}
      <main className="flex items-center justify-center px-6 py-12 sm:py-16">
        <div className="w-full max-w-sm">
          {/* C2 — the persuasion rail is hidden below lg; carry one value line
              above the form so the "why" survives the breakpoint. */}
          <p className="mb-6 text-xs font-medium text-[var(--p-text-2)] lg:hidden">
            <span className="font-semibold text-[var(--p-accent-text)]">{tagline}</span>{" "}
            {highlights[0]?.label}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-[var(--p-text-2)]">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-center text-xs text-[var(--p-text-2)]">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
