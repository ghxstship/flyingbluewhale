"use client";

import Link from "next/link";

/**
 * AtomPicker — native select for pinning an artifact to an xpms_atom.
 *
 * Server component fetches the candidate atom list (project-scoped or
 * org-scoped) and hands it down. Empty/unpinned is the default.
 *
 * Identifier is rendered first because that's how operators search for
 * atoms in the catalog ("GHX-EQP-5.3.2-INV-0001A"). The atom name and
 * the parent project (when org-scoped) are shown as additional context.
 */
export type AtomOption = {
  id: string;
  identifier: string;
  name: string;
  /** Set when the picker is org-scoped (atoms across projects). */
  project_name?: string | null;
};

export function AtomPicker({
  name,
  atoms,
  defaultValue,
  required,
  label = "Pin to atom",
  hint,
  catalogHref = "/console/xpms",
}: {
  /** Form field name — `xpms_atom_id` for tasks, `atom_id` for deliverables/expenses/PO line items. */
  name: string;
  atoms: AtomOption[];
  defaultValue?: string | null;
  required?: boolean;
  label?: string;
  hint?: string;
  catalogHref?: string;
}) {
  const sorted = [...atoms].sort((a, b) => {
    const pn = (a.project_name ?? "").localeCompare(b.project_name ?? "");
    return pn !== 0 ? pn : a.identifier.localeCompare(b.identifier);
  });
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-[var(--p-text-2)]">
          {label}
          {!required && <span className="ms-1 text-[var(--p-text-2)]">(optional)</span>}
        </label>
        <Link href={catalogHref} className="text-xs text-[var(--p-accent)] hover:underline">
          + New atom
        </Link>
      </div>
      <select name={name} defaultValue={defaultValue ?? ""} required={required} className="ps-input mt-1.5 w-full">
        {!required && <option value="">— Unpinned —</option>}
        {sorted.map((a) => (
          <option key={a.id} value={a.id}>
            {a.project_name ? `${a.project_name} · ` : ""}
            {a.identifier} — {a.name}
          </option>
        ))}
      </select>
      {hint && <p className="mt-1 text-xs text-[var(--p-text-2)]">{hint}</p>}
    </div>
  );
}
