// ──────────────────────────────────────────────────────────────
// Catalog kinds — the things you can assign to a party.
// Mirrors public.catalog_kind in the database (0067; 'labor' added
// with the XPMS master catalog, migration 20260608120000).
//
// Pure constants only — NO `server-only`, no supabase imports — so client
// components (the Advance request form, the Advance Cart) can import the
// kind vocabulary without pulling the server client into the browser
// bundle. `@/lib/db/assignments` re-exports these for server callers.
// ──────────────────────────────────────────────────────────────

export const CATALOG_KINDS = [
  "ticket",
  "credential",
  "catering",
  "radio",
  "tool",
  "equipment",
  "uniform",
  "travel",
  "lodging",
  "vehicle",
  "labor",
] as const;
export type CatalogKind = (typeof CATALOG_KINDS)[number];

export const CATALOG_KIND_LABEL: Record<CatalogKind, string> = {
  ticket: "Tickets",
  credential: "Credentials",
  catering: "Catering",
  radio: "Radios",
  tool: "Tools",
  equipment: "Equipment",
  uniform: "Uniforms",
  travel: "Travel",
  lodging: "Lodging",
  vehicle: "Vehicles",
  labor: "Labor",
};

export const CATALOG_KIND_LABEL_SINGULAR: Record<CatalogKind, string> = {
  ticket: "Ticket",
  credential: "Credential",
  catering: "Catering item",
  radio: "Radio",
  tool: "Tool",
  equipment: "Equipment",
  uniform: "Uniform",
  travel: "Travel itinerary",
  lodging: "Lodging",
  vehicle: "Vehicle",
  labor: "Labor booking",
};
