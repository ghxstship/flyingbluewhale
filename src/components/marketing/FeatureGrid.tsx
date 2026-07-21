import type { LucideIcon } from "lucide-react";

export type Feature = {
  icon?: LucideIcon;
  title: string;
  body: string;
  href?: string;
};

export function FeatureGrid({ features, cols = 3 }: { features: Feature[]; cols?: 2 | 3 | 4 }) {
  const colsClass = cols === 2 ? "md:grid-cols-2" : cols === 4 ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-3";
  return (
    <div className={`grid gap-3 ${colsClass}`}>
      {features.map((f) => {
        const Icon = f.icon;
        const inner = (
          // hover-lift only when the card links somewhere — otherwise the lift
          // is a hover affordance on a non-interactive card.
          <div className={`surface h-full p-5${f.href ? " hover-lift" : ""}`}>
            {Icon && (
              <div
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--p-surface)]"
                style={{ color: "var(--p-accent)" }}
              >
                <Icon size={18} />
              </div>
            )}
            <div className="mt-3 text-sm font-semibold">{f.title}</div>
            <p className="mt-2 text-sm text-[var(--p-text-2)]">{f.body}</p>
          </div>
        );
        if (f.href)
          return (
            <a key={f.title} href={f.href}>
              {inner}
            </a>
          );
        return <div key={f.title}>{inner}</div>;
      })}
    </div>
  );
}
