import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import type { ReactNode } from "react";

/**
 * Shared layout for record detail pages. Every console detail page
 * passes a loaded row, a title function, and an optional list of key/
 * value fields. If the row is nullish, the shell 404s.
 */
export function DetailShell<T>({
  row,
  eyebrow,
  title,
  subtitle,
  breadcrumbs,
  fields,
  action,
  children,
}: {
  row: T | null | undefined;
  eyebrow: string;
  title: (r: T) => string;
  subtitle?: string | ((r: T) => string | null | undefined);
  breadcrumbs: Array<{ label: string; href?: string }>;
  fields?: Array<{ label: string; value: ReactNode }>;
  action?: ReactNode;
  children?: ReactNode;
}) {
  if (!row) notFound();
  const resolvedSubtitle = typeof subtitle === "function" ? subtitle(row) ?? undefined : subtitle;
  return (
    <>
      <ModuleHeader
        eyebrow={eyebrow}
        title={title(row)}
        subtitle={resolvedSubtitle}
        breadcrumbs={breadcrumbs}
        action={action}
      />
      <div className="page-content max-w-5xl space-y-5">
        {fields && fields.length > 0 && (
          <dl className="surface grid gap-0 divide-y divide-[var(--border-color)] md:grid-cols-2 md:divide-y-0">
            {fields.map((f, i) => (
              <div
                key={`${f.label}-${i}`}
                className="px-5 py-3 md:border-b md:border-[var(--border-color)] md:[&:nth-last-child(-n+2)]:border-b-0"
              >
                <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  {f.label}
                </dt>
                <dd className="mt-1 text-sm text-[var(--foreground)]">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {children}
      </div>
    </>
  );
}

/**
 * Coerce a cents value into a `$X,XXX.XX` string (or `—` for null).
 * Minor helper since detail pages render money a lot. Locale-aware; the
 * caller can override currency via the existing `formatMoney` if needed.
 */
export function money(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(cents / 100);
}

export function fmtDate(raw: string | null | undefined): string {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

export function fmtDateTime(raw: string | null | undefined): string {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}
