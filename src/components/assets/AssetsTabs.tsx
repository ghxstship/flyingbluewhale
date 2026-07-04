import Link from "next/link";

/**
 * The unified Assets & Inventory tab family (kit 20 `_ia-dump.md`, owner
 * `inventory`): Registry · Fleet · Lots · Pull Sheets · Scan Sessions ·
 * Sub-Rentals · Warranties · Maintenance · Power Plan. One noun, one home,
 * two shelves — the rail carries a single "Assets & Inventory" item and
 * every sub-surface lives here on the second shelf. Fleet and Lots are the
 * re-exposed legacy routes, now filtered lenses over `assets.asset_class`.
 */
export const ASSET_TABS = [
  { href: "/studio/assets", label: "Registry" },
  { href: "/studio/production/equipment", label: "Fleet" },
  { href: "/studio/logistics/warehouse", label: "Lots" },
  { href: "/studio/assets/pull-sheets", label: "Pull Sheets" },
  { href: "/studio/assets/scans", label: "Scan Sessions" },
  { href: "/studio/production/rentals", label: "Sub-Rentals" },
  { href: "/studio/assets/warranties", label: "Warranties" },
  { href: "/studio/operations/maintenance", label: "Maintenance" },
  { href: "/studio/assets/power", label: "Power Plan" },
] as const;

export function AssetsTabs({ active }: { active: string }) {
  return (
    <div role="tablist" aria-label="Assets & Inventory sections" className="inline-flex flex-wrap items-center gap-1.5">
      {ASSET_TABS.map((tab) => {
        const isActive = tab.href === active;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            role="tab"
            aria-selected={isActive}
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs transition-colors ${
              isActive
                ? "border-[var(--p-accent)] bg-[var(--p-accent)] text-[var(--p-accent-contrast,var(--p-bg))]"
                : "border-[var(--p-border)] hover:bg-[var(--p-surface-2)]"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
