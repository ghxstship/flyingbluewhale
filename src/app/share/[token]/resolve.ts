import "server-only";

/**
 * Resolve a (resource_table, resource_id) pair to the destination URL the
 * passcode-unlock action should redirect to.
 *
 * Every resource type renders inline on /share/[token] itself (proposals →
 * the read-only proposal document, guides → GuideView, saved views /
 * dashboards → an honest summary card with a sign-in CTA), so the unlock
 * action always redirects back here with `?unlocked=1` — the page then
 * dispatches to the right renderer without consuming a second use.
 */
export function resolveResourceUrl(table: string, id: string, token: string): string {
  return `/share/${encodeURIComponent(token)}?unlocked=1&t=${encodeURIComponent(table)}&id=${encodeURIComponent(id)}`;
}
