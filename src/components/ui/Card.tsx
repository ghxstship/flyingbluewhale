import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Card — polymorphic: renders as div/button/a based on interactive + href.
 * When href or onClick is provided it becomes keyboard-accessible with a
 * focus ring.
 */
type CardProps = {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  elevated?: boolean;
  href?: string;
  onClick?: () => void;
  "aria-label"?: string;
};

export function Card({ children, className = "", interactive, elevated, href, onClick, ...props }: CardProps) {
  const base = elevated ? "surface-raised" : "surface";
  const isInteractive = interactive || !!href || !!onClick;
  const hover = isInteractive ? "hover-lift cursor-pointer focus-ring outline-none" : "";
  const cls = `${base} ${hover} ${className}`.trim();

  if (href) {
    return (
      <Link href={href} className={cls} aria-label={props["aria-label"]}>
        {children}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cls} aria-label={props["aria-label"]}>
        {children}
      </button>
    );
  }
  return <div className={cls}>{children}</div>;
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

export function CardFooter({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex items-center justify-between gap-2 border-t border-[var(--border-color)] px-5 py-3 ${className}`.trim()}>
      {children}
    </div>
  );
}
