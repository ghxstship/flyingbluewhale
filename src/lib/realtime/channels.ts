/**
 * Channel-name conventions for Supabase Realtime.
 *
 * Per-record channels are namespaced by `(table, id)` so a project detail page
 * and a deliverable detail page never collide, even if their UUIDs overlap.
 *
 * - `presence:{table}:{id}` — track who's viewing a record (avatars).
 * - `record:{table}:{id}` — postgres_changes filter for live row updates.
 *
 * See: `docs/research/smartsuite-parity/04-solutions-permissions-collab.md` (#5).
 */

export function presenceChannelName(table: string, id: string): string {
  return `presence:${table}:${id}`;
}

export function recordChannelName(table: string, id: string): string {
  return `record:${table}:${id}`;
}
