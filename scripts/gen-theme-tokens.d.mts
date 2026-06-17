// Type declarations for the theme token generator (consumed by
// src/lib/theme/gen-theme.test.ts). The implementation is plain ESM JS so the
// `node scripts/gen-theme-tokens.mjs` CLI runs without a build step.

export const TOKENS_PATH: string;
export const THEME_PATH: string;

type RegionId = "brand" | "tokens";

export function renderBrandRegion(tokens: unknown): string;
export function renderTokenRegion(tokens: unknown): string;
export function renderRegion(tokens: unknown, id: RegionId): string;
export function regionBody(fileText: string, id: RegionId): string;
