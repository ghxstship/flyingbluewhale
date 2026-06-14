/**
 * Estimates domain enums. Lives in lib (not the "use server" actions file) so
 * both the server action's Zod schema and the edit form's <select> can import
 * it — a "use server" module may only export async functions.
 */
export const ESTIMATE_STATES = ["draft", "in_review", "submitted", "won", "lost", "archived"] as const;
export type EstimateState = (typeof ESTIMATE_STATES)[number];
