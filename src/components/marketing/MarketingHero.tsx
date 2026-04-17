import type { ReactNode } from "react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function MarketingHero({
  eyebrow,
  title,
  subtitle,
  actions,
  meta,
  accent,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  actions?: ReactNode;
  meta?: ReactNode;
  accent?: "atlvs" | "gvteway" | "compvss";
}) {
  return (
    <section data-platform={accent} className="mx-auto max-w-6xl px-6 pt-20 pb-12 text-balance">
      {eyebrow && (
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--org-primary)]">
          {eyebrow}
        </div>
      )}
      <ScrollReveal>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight sm:text-6xl">{title}</h1>
      </ScrollReveal>
      <ScrollReveal delay={0.1}>
        <p className="mt-5 max-w-2xl text-base text-[var(--text-secondary)] sm:text-lg">{subtitle}</p>
      </ScrollReveal>
      {actions && <ScrollReveal delay={0.2}><div className="mt-8 flex flex-wrap gap-3">{actions}</div></ScrollReveal>}
      {meta && <div className="mt-8">{meta}</div>}
    </section>
  );
}
