/**
 * Atom overlay merge — org settings over the immutable XPMS master catalog
 * (LEG3ND P4; table `org_xpms_atom_settings`, migration 20260723160000).
 *
 * Contract (ratcheted by atom-overlay.test.ts): the overlay NEVER masks
 * catalog rows structurally. Every catalog atom passed in comes back out —
 * a disabled atom is flagged (`enabled: false`), never dropped; an org label
 * overrides display, never the canonical name.
 */

export type AtomOverlaySetting = {
  xpms_atom_id: string;
  enabled: boolean;
  org_label: string | null;
};

export type OverlaidAtom<T> = T & {
  /** Org-effective availability. No overlay row = enabled. */
  enabled: boolean;
  /** The org's vocabulary override, when set. */
  orgLabel: string | null;
  /** What the org sees: orgLabel when set, else the canonical name. */
  displayName: string;
};

/**
 * Merge org overlay settings onto catalog atoms. Pure, order-preserving,
 * length-preserving. Overlay rows for atoms not in `atoms` are ignored.
 */
export function mergeAtomOverlay<T extends { xpms_atom_id: string; name: string }>(
  atoms: readonly T[],
  settings: readonly AtomOverlaySetting[],
): OverlaidAtom<T>[] {
  const byAtom = new Map(settings.map((s) => [s.xpms_atom_id, s]));
  return atoms.map((atom) => {
    const s = byAtom.get(atom.xpms_atom_id);
    const orgLabel = s?.org_label?.trim() ? s.org_label.trim() : null;
    return {
      ...atom,
      enabled: s ? s.enabled : true,
      orgLabel,
      displayName: orgLabel ?? atom.name,
    };
  });
}
