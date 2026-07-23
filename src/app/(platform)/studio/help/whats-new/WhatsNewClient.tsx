"use client";

import * as React from "react";
import { Sparkles, Wrench, ShieldCheck, Gauge } from "lucide-react";
import type { ChangelogEntry, ChangelogKind } from "@/lib/changelog";
import { markWhatsNewSeen } from "@/lib/help/whats-new";
import { useT } from "@/lib/i18n/LocaleProvider";

const KIND_ICON: Record<ChangelogKind, typeof Sparkles> = {
  feature: Sparkles,
  improvement: Wrench,
  security: ShieldCheck,
  performance: Gauge,
};

type FilterKey = "all" | "feature" | "improvement";

/**
 * What's New (kit 21 W6) — the console changelog reader. All / New / Improved
 * filter chips over the shared CHANGELOG_ENTRIES; opening the page marks the
 * latest release seen so the Help-icon unread dot clears.
 */
export function WhatsNewClient({
  entries,
  labels,
}: {
  entries: ChangelogEntry[];
  labels: { all: string; new: string; improved: string; empty: string };
}) {
  const t = useT();
  const [filter, setFilter] = React.useState<FilterKey>("all");
  const kindLabels: Record<ChangelogKind, string> = {
    feature: t("console.help.whatsNew.kinds.feature", undefined, "New"),
    improvement: t("console.help.whatsNew.kinds.improvement", undefined, "Improved"),
    security: t("console.help.whatsNew.kinds.security", undefined, "Security"),
    performance: t("console.help.whatsNew.kinds.performance", undefined, "Faster"),
  };

  React.useEffect(() => {
    markWhatsNewSeen();
  }, []);

  const shown = filter === "all" ? entries : entries.filter((e) => e.kind === filter);

  const chips: Array<{ key: FilterKey; label: string }> = [
    { key: "all", label: labels.all },
    { key: "feature", label: labels.new },
    { key: "improvement", label: labels.improved },
  ];

  return (
    <div className="max-w-2xl">
      <div className="mb-4 flex gap-2">
        {chips.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setFilter(c.key)}
            aria-pressed={filter === c.key}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              filter === c.key
                ? "border-[var(--p-accent)] bg-[var(--p-accent)] text-[var(--p-accent-contrast,white)]"
                : "border-[var(--p-border)] text-[var(--p-text-2)] hover:bg-[var(--p-surface)]"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-[var(--p-text-2)]">{labels.empty}</p>
      ) : (
        <ol className="space-y-4">
          {shown.map((e) => {
            const meta = { label: kindLabels[e.kind], Icon: KIND_ICON[e.kind] };
            const Icon = meta.Icon;
            return (
              <li key={e.version} className="surface p-5">
                <div className="mb-2 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--p-accent-weak,var(--p-surface))] px-2 py-0.5 text-[11px] font-semibold text-[var(--p-accent-text)]">
                    <Icon size={12} aria-hidden="true" />
                    {meta.label}
                  </span>
                  <span className="font-mono text-[11px] text-[var(--p-text-3)]">{e.version}</span>
                  <span className="font-mono text-[11px] text-[var(--p-text-3)]">{e.date}</span>
                </div>
                <h2 className="text-base font-semibold text-[var(--p-text-1)]">{e.title}</h2>
                <p className="mt-1 text-sm text-[var(--p-text-2)]">{e.body}</p>
                {e.items.length > 0 && (
                  <ul className="mt-2 list-disc space-y-0.5 ps-5 text-sm text-[var(--p-text-2)]">
                    {e.items.map((it, i) => (
                      <li key={i}>{it}</li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
