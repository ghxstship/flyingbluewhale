import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  interactive,
  elevated,
}: { children: ReactNode; className?: string; interactive?: boolean; elevated?: boolean }) {
  const base = elevated ? "surface-raised" : "surface";
  const hover = interactive ? "hover-lift cursor-pointer" : "";
  return <div className={`${base} ${hover} ${className}`.trim()}>{children}</div>;
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--border-color)] px-5 py-3.5">
      <div>
        <h3 className="text-sm font-semibold text-[var(--foreground)]">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-[var(--text-muted)]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`p-5 ${className}`.trim()}>{children}</div>;
}
