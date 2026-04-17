import type { ReactNode } from 'react';

/* ═══════════════════════════════════════════════════════
   DetailPanel — Canonical detail sidebar card
   Extracted from deliverable [id] page. Displays
   a labeled key-value list in a card surface.
   ═══════════════════════════════════════════════════════ */

export interface DetailField {
  label: string;
  value: ReactNode;
}

interface DetailPanelProps {
  title: string;
  fields?: DetailField[];
  children?: ReactNode;
  className?: string;
}

export function DetailPanel({
  title,
  fields,
  children,
  className = '',
}: DetailPanelProps) {
  return (
    <div className={`detail-card ${className}`}>
      <h3 className="text-label text-text-tertiary mb-3">{title}</h3>
      {fields && fields.length > 0 && (
        <dl className="flex flex-col gap-2 text-xs">
          {fields.map((field) => (
            <div key={field.label} className="flex justify-between">
              <dt className="text-text-disabled">{field.label}</dt>
              <dd className="text-text-primary text-mono">{field.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {children}
    </div>
  );
}
