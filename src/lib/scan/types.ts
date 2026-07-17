import type { ScanResult } from "@/lib/db/assignments";

/**
 * The wire shape of a resolved scan — shared by the resolver chain
 * (`@/lib/db/scan`, server-only) and the field surfaces that render it.
 *
 * It lives here rather than beside the resolver because `@/lib/db/scan` is
 * `server-only`: a client component importing the type from there would pull
 * the server module into the browser bundle and fail the build. Types are
 * erased at compile time, so this module stays dependency-free and safe on
 * both sides.
 *
 * `source` is the discriminator the UI needs: an accepted credential and an
 * identified forklift are both "the scan worked", but they are not the same
 * outcome and must not render the same.
 */
/**
 * One open advance line for a matched product — an `assignments` row on the
 * caller's org whose `catalog_item_id` matches and whose `fulfillment_state`
 * is `approved` (the "Approved" step of the Requested → Approved → Fulfilled
 * mini-track). Names are hydrated server-side so the field card renders
 * without further round-trips.
 */
export type ProductAdvanceLine = {
  assignmentId: string;
  title: string | null;
  partyName: string | null;
  projectName: string | null;
  /** ISO date, when the line carries one. Formatting is the renderer's job. */
  deadline: string | null;
};

export type ResolvedScan =
  | (ScanResult & { source: "assignment" })
  | {
      result: "asset";
      source: "asset";
      assetId: string;
      displayName: string | null;
      assetTag: string | null;
      /** `ual_state` — available / in_use / … . Reported, never mutated here. */
      state: string | null;
    }
  | {
      /**
       * Resolver 3 matched a catalog GTIN binding (kit 30). Identification
       * plus the open approved advance lines for the item — fulfillment
       * itself stays behind its own explicit action, mirroring resolver 2's
       * read-only stance.
       */
      result: "product";
      source: "product";
      /** Canonical GTIN-14 the scanned code normalized to. */
      gtin14: string;
      matchSource: "catalog_binding";
      catalogItemId: string;
      catalogKind: string;
      /** "Vehicle · Golf Cart" — singular kind label · catalog item name. */
      displayName: string;
      openLines: ProductAdvanceLine[];
    }
  | { result: "not_found"; source: "unknown" };

/** Every verdict the field UI may receive. */
export type ResolvedScanVerdict = ResolvedScan["result"];
