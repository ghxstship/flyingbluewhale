"use client";

/**
 * <FormView> — single-record field view (Phase 3.x of the SmartSuite
 * view-matrix parity; the "form" `DataViewKind`). SmartSuite Form View
 * parity: instead of a row in a grid, one record is laid out field-by-
 * field, label + value stacked, grouped into optional sections. This is
 * the read-oriented counterpart of `<FormShell>` (which is for input) —
 * use it for record summaries, side-panels, and print/detail layouts.
 *
 *     <FormView
 *       title={item.name}
 *       fields={[
 *         { label: "Code", value: item.code, mono: true },
 *         { label: "Status", value: <StatusBadge status={item.lifecycle_state} /> },
 *       ]}
 *     />
 *
 * Token/.ps-* styled only — no hex, no hardcoded fonts. "use client" only
 * to sit alongside the other client view renderers in the registry; it
 * has no interactive state of its own.
 */

import * as React from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { useT } from "@/lib/i18n/LocaleProvider";

export type FormViewField = {
  /** Field label. */
  label: string;
  /** Field value — scalar text or a React node (e.g. a <StatusBadge>). */
  value: React.ReactNode;
  /** Render the value in the mono font (codes, ids, amounts). */
  mono?: boolean;
  /** Span both columns on the lg breakpoint (long text / notes). */
  full?: boolean;
};

export type FormViewSection = {
  /** Optional section heading. */
  title?: string;
  fields: FormViewField[];
};

export type FormViewProps = {
  /** Record title (rendered as the form heading). */
  title?: string;
  /** Optional subtitle under the title. */
  subtitle?: string | null;
  /** Either a flat field list or grouped sections. */
  fields?: FormViewField[];
  sections?: FormViewSection[];
  /** Empty-state copy when there are no fields. */
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
};

export function FormView({
  title,
  subtitle,
  fields,
  sections,
  emptyTitle,
  emptyDescription,
  className,
}: FormViewProps): React.ReactElement {
  const t = useT();

  const resolvedSections: FormViewSection[] = sections ?? (fields ? [{ fields }] : []);
  const totalFields = resolvedSections.reduce((acc, s) => acc + s.fields.length, 0);

  if (totalFields === 0) {
    return (
      <EmptyState
        title={emptyTitle ?? t("components.formView.emptyTitle", undefined, "No Fields")}
        description={
          emptyDescription ??
          t("components.formView.emptyDescription", undefined, "This record has no fields to display.")
        }
      />
    );
  }

  return (
    <div className={["surface p-5 sm:p-6", className ?? ""].join(" ")}>
      {(title || subtitle) && (
        <header className="mb-5 border-b border-[var(--p-border)] pb-4">
          {title ? <h2 className="text-base font-semibold text-[var(--p-text-1)]">{title}</h2> : null}
          {subtitle ? <p className="mt-1 text-sm text-[var(--p-text-2)]">{subtitle}</p> : null}
        </header>
      )}
      <div className="flex flex-col gap-6">
        {resolvedSections.map((section, si) => (
          <section key={section.title ?? `section-${si}`}>
            {section.title ? (
              <h3 className="mb-3 text-xs font-semibold tracking-[0.16em] text-[var(--p-text-2)] uppercase">
                {section.title}
              </h3>
            ) : null}
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {section.fields.map((field, fi) => (
                <div key={`${field.label}-${fi}`} className={field.full ? "sm:col-span-2" : undefined}>
                  <dt className="mb-1 text-[11px] font-medium tracking-wide text-[var(--p-text-2)] uppercase">
                    {field.label}
                  </dt>
                  <dd
                    className={`text-sm text-[var(--p-text-1)] ${
                      field.mono ? "font-mono" : ""
                    }`}
                  >
                    {isEmptyValue(field.value)
                      ? t("components.formView.empty", undefined, "—")
                      : field.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </div>
  );
}

function isEmptyValue(v: React.ReactNode): boolean {
  return v == null || v === "";
}
