"use client";

import { useEffect, useState } from "react";
import type { Proposal } from "@/lib/supabase/types";
import type { ProposalBlock } from "@/lib/proposals/types";

export function ProposalTopBar({ proposal, blocks }: { proposal: Proposal; blocks: ProposalBlock[] }) {
  const [active, setActive] = useState<number>(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-section-index") ?? 0);
            setActive(idx);
          }
        });
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 },
    );
    document.querySelectorAll<HTMLElement>("[data-section-index]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const sections = blocks
    .map((b, i) => ({ b, i }))
    .filter((x) => ["hero", "section_eyebrow", "investment_table", "terms_grid", "signature_block"].includes(x.b.type))
    .map(({ b, i }) => ({
      i,
      label:
        b.type === "hero"
          ? "Cover"
          : b.type === "section_eyebrow"
            ? b.label
            : b.type === "investment_table"
              ? "Investment"
              : b.type === "terms_grid"
                ? "Terms"
                : b.type === "signature_block"
                  ? "Authorize"
                  : "Section",
    }));

  return (
    <nav className="glass-nav sticky top-0 z-30 flex items-center justify-between border-b px-6 py-2.5">
      <div className="flex items-center gap-4">
        <span className="font-mono text-[11px] text-[var(--p-text-2)]">
          {proposal.doc_number ?? proposal.id.slice(0, 8)} · v{proposal.version}
        </span>
        <span className="hidden text-xs font-semibold sm:inline">{proposal.title}</span>
      </div>
      <div className="flex items-center gap-1 overflow-x-auto">
        {sections.map((s) => (
          <a
            key={s.i}
            href={`#section-${s.i}`}
            className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold tracking-widest uppercase ${active === s.i ? "bg-[var(--p-accent)]/10 text-[var(--p-accent)]" : "text-[var(--p-text-2)] hover:text-[var(--p-text-1)]"}`}
          >
            {s.label}
          </a>
        ))}
        <button
          type="button"
          onClick={() => window.print()}
          className="print-hide ms-2 shrink-0 rounded-full border border-[var(--p-border)] px-3 py-1 text-[11px] font-semibold tracking-widest uppercase hover:bg-[var(--p-surface)]"
        >
          Print / PDF
        </button>
      </div>
    </nav>
  );
}
