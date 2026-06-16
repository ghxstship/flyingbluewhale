/**
 * Accounting-system → pull-side sync endpoint map. Plain module (not a server
 * action file) so it can export the non-async `isSyncable` helper used by both
 * the detail page (to decide whether to show "Sync now") and the server action.
 */
export const SYNC_ENDPOINT: Record<string, string> = {
  qb_online: "/api/v1/integrations/qb-online/sync",
  sage_300_cre: "/api/v1/integrations/sage-300-cre/sync",
  foundation: "/api/v1/integrations/foundation/sync",
  viewpoint_vista: "/api/v1/integrations/viewpoint-vista/sync",
};

export function isSyncable(system: string): boolean {
  return system in SYNC_ENDPOINT;
}
