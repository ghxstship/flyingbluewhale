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
  | { result: "not_found"; source: "unknown" };

/** Every verdict the field UI may receive. */
export type ResolvedScanVerdict = ResolvedScan["result"];
