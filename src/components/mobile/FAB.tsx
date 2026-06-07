"use client";

import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Floating Action Button — thumb-reachable primary action.
 * Honors iOS safe-area inset so it sits above the home indicator.
 */
export function FAB({
  href,
  onClick,
  label,
  children,
  variant = "primary",
}: {
  href?: string;
  onClick?: () => void;
  label: string;
  children: ReactNode;
  variant?: "primary" | "danger";
}) {
  const cls = `fixed end-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-[var(--p-border)] transition-transform active:scale-95 ${
    variant === "danger"
      ? "bg-[var(--p-danger)] text-[var(--p-bg)]"
      : "bg-[var(--p-accent)] text-[var(--p-accent-contrast,var(--p-bg))]"
  }`;
  const style = { bottom: "calc(env(safe-area-inset-bottom, 0px) + 5rem)" } as const;

  if (href) {
    return (
      <Link href={href} className={cls} style={style} aria-label={label}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls} style={style} aria-label={label}>
      {children}
    </button>
  );
}
