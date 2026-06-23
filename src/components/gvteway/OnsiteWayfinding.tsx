import { SignIcon } from "@/components/signage/SignIcon";

/**
 * OnsiteWayfinding — venue "getting around" legend for the Onsite surface
 * (design_handoff §3, "wayfinding uses the signage system"). Renders the key
 * venue amenities through the shared AIGA / U.S. DOT pictogram system
 * (`SignIcon` → `/brand/pictograms.svg`), so onsite wayfinding speaks the same
 * standards-locked sign language as the rest of the platform — no bespoke icons.
 *
 * Token-only colors; glyphs paint in the inherited text color.
 */
const SIGNS: { id: string; label: string }[] = [
  { id: "aiga-toilets", label: "Restrooms" },
  { id: "aiga-first-aid", label: "First aid" },
  { id: "aiga-drinking-fountain", label: "Water" },
  { id: "aiga-restaurant", label: "Food" },
  { id: "aiga-bar", label: "Bar" },
  { id: "aiga-coat-check", label: "Coat check" },
  { id: "aiga-exit", label: "Exit" },
  { id: "aiga-taxi", label: "Rides" },
];

export function OnsiteWayfinding() {
  return (
    <ul className="grid grid-cols-4 gap-2">
      {SIGNS.map((s) => (
        <li
          key={s.id}
          className="surface flex flex-col items-center gap-1 rounded-[var(--p-r-md)] p-2 text-[var(--p-text-1)]"
        >
          <SignIcon name={s.id} size={28} title={s.label} />
          <span className="text-[10px] font-medium text-[var(--p-text-2)]">{s.label}</span>
        </li>
      ))}
    </ul>
  );
}
