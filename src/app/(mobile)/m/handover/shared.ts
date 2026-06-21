/** Marker that flags a `daily_logs` note as a shift handover (no dedicated
 * table). Lives outside the `"use server"` actions module because a server
 * actions file may only export async functions. */
export const HANDOVER_MARKER = "[HANDOVER]";
