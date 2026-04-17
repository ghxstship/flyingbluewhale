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
          <div className="surface hover-lift h-full p-5">
            {Icon && (
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--bg-secondary)]" style={{ color: "var(--org-primary)" }}>
                <Icon size={18} />
              </div>
            )}
            <div className="mt-3 text-sm font-semibold">{f.title}</div>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{f.body}</p>
          </div>
        );
        if (f.href) return <a key={f.title} href={f.href}>{inner}</a>;
        return <div key={f.title}>{inner}</div>;
      })}
    </div>
  );
}
