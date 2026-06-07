/**
 * BaseDashboard — the shared shell rendered by all 10 XPMS-class
 * dashboard templates. Each per-class template (Executive, Creative,
 * Talent, Marketing, Build, Production, Operations, Experience,
 * Hospitality, Technology) is a thin wrapper that sets default
 * accent + cover treatment + section ordering for its class, then
 * delegates to BaseDashboard for the actual layout.
 *
 * Programa-equivalent: the branded client-dashboard layout. Single
 * cover band + curated sections + share-link chrome.
 */

import { XPMS_CLASSES } from "@/lib/xpms";
import type { DashboardProps } from "./types";

export function BaseDashboard({ classCode, title, subtitle, branding, sections, footer }: DashboardProps) {
  const xpmsClass = XPMS_CLASSES[classCode];
  const accent = branding?.accent ?? xpmsClass.accent;

  return (
    <div className="mx-auto w-full max-w-5xl">
      {/* Cover band — accent strip + title block */}
      <header
        className="relative overflow-hidden rounded-lg border border-[var(--p-border)] bg-[var(--p-surface)]"
        style={{ borderTop: `4px solid ${accent}` }}
        data-class-code={classCode}
        data-class-name={xpmsClass.name}
      >
        {branding?.coverUrl ? (
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: `url(${branding.coverUrl})` }}
          />
        ) : null}
        <div className="relative flex items-start gap-4 p-6">
          {branding?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- org-uploaded logo on arbitrary storage host; next/image would require per-org remotePatterns entries.
            <img
              src={branding.logoUrl}
              alt=""
              aria-hidden="true"
              className="h-10 w-10 shrink-0 rounded border border-[var(--p-border)] object-contain"
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10px] font-semibold tracking-[0.18em]" style={{ color: accent }}>
              {String(classCode).padStart(1, "0")} · {xpmsClass.name}
            </div>
            <h1 className="mt-1 truncate text-2xl font-semibold text-[var(--p-text-1)]">{title}</h1>
            {subtitle ? <p className="mt-1 truncate text-sm text-[var(--p-text-2)]">{subtitle}</p> : null}
          </div>
        </div>
      </header>

      {/* Section grid — single column on small screens, two on lg+. The
          template itself is layout-only; per-section data lives with
          the caller. */}
      <main className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {sections.map((s) => (
          <section
            key={s.key}
            data-section-key={s.key}
            className="rounded-lg border border-[var(--p-border)] bg-[var(--p-surface)] p-4"
          >
            <header className="mb-3">
              <h2 className="text-sm font-semibold tracking-wide text-[var(--p-text-1)]">{s.title}</h2>
              {s.description ? <p className="mt-0.5 text-xs text-[var(--p-text-2)]">{s.description}</p> : null}
            </header>
            <div className="text-sm">{s.body}</div>
          </section>
        ))}
      </main>

      {footer ? <footer className="mt-6">{footer}</footer> : null}
    </div>
  );
}
