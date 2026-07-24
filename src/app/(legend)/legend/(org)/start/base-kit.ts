/**
 * The XPMS 2.5 base-kit contents, verbatim from migration
 * 20260723010000_xpms25_org_hub_foundation.sql (seed_org_xpms_defaults).
 *
 * Lives outside actions.ts because "use server" modules may only export
 * async functions; the page renders these lists so the user sees exactly
 * what the install writes before running it.
 */
export const BASE_KIT_COST_CENTERS: ReadonlyArray<readonly [code: string, name: string]> = [
  ["0000", "Executive"],
  ["1000", "Creative"],
  ["2000", "Talent"],
  ["3000", "Marketing"],
  ["4000", "Build"],
  ["5000", "Production"],
  ["6000", "Operations"],
  ["7000", "Experience"],
  ["8000", "Hospitality"],
  ["9000", "Technology"],
];

export const BASE_KIT_POSITIONS: ReadonlyArray<readonly [title: string, departmentCode: string]> = [
  ["Executive Producer", "0000"],
  ["Creative Director", "1000"],
  ["Talent Director", "2000"],
  ["Marketing Director", "3000"],
  ["Head Of Build", "4000"],
  ["Production Director", "5000"],
  ["Operations Director", "6000"],
  ["Experience Director", "7000"],
  ["Hospitality Director", "8000"],
  ["Technology Director", "9000"],
];
