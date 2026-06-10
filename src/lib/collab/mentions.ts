/**
 * @-mention parsing for comment threads.
 *
 * Spec mirrors SmartSuite's Mentions behavior
 * (https://help.smartsuite.com/en/articles/4752876-mentions):
 *   - `@handle`        — user mention (1-40 chars, [a-zA-Z0-9_.-])
 *   - `@team-<slug>`   — team mention (slug = [a-z0-9-])
 *
 * Boundary rules:
 *   - Must be at start-of-string OR preceded by a non-identifier char
 *     (anything not in [a-zA-Z0-9_]). This excludes email-style runs
 *     like `julian@ghxstship.pro` where `@` is preceded by an ident char.
 *   - Must be followed by a non-identifier char (or end-of-string).
 *
 * Team mentions are detected first; the user-mention regex's prefix excludes
 * `team-` (one of the few names that shouldn't double-match).
 */

export type ParsedMention = {
  kind: "user" | "team";
  /** Raw handle without the leading `@` (and without the `team-` prefix for teams). */
  handle: string;
  /** Inclusive start offset of the `@` in the source string. */
  start: number;
  /** Exclusive end offset (one past the last matched character). */
  end: number;
};

// Identifier-character predicate — the boundary used on both sides.
const IDENT = /[a-zA-Z0-9_]/;

// Left-boundary predicate — extends IDENT with `@` so we reject `@@handle`.
// Right-boundary stays IDENT so trailing `.` / `,` still close a mention.
const LEFT_REJECT = /[a-zA-Z0-9_@]/;

// Greedy single-pass tokenizer. We don't use lookbehind for compatibility
// across older runtimes; the `prevChar` check is hand-rolled.
const TOKEN_RE = /@([a-zA-Z0-9_.-]{1,80})/g;

const TEAM_PREFIX = "team-";
const TEAM_SLUG = /^[a-z0-9-]{1,40}$/;
const USER_HANDLE = /^[a-zA-Z0-9_.-]{1,40}$/;

export function parseMentions(text: string): ParsedMention[] {
  if (!text) return [];
  const out: ParsedMention[] = [];
  let m: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(text)) !== null) {
    const start = m.index;
    const matched = m[0];
    const raw = m[1]!;
    const end = start + matched.length;

    // Left boundary: must be start-of-string or not in LEFT_REJECT.
    // (LEFT_REJECT = ident chars + `@` so `@@bad` and `foo@bar` are rejected.)
    const prev = start === 0 ? "" : text[start - 1];
    if (prev && LEFT_REJECT.test(prev)) continue;

    // Right boundary: end-of-string or non-ident char.
    const next = end < text.length ? text[end] : "";
    if (next && IDENT.test(next)) continue;

    if (raw.startsWith(TEAM_PREFIX)) {
      const slug = raw.slice(TEAM_PREFIX.length);
      if (slug.length === 0) continue;
      if (!TEAM_SLUG.test(slug)) continue;
      out.push({ kind: "team", handle: slug, start, end });
      continue;
    }

    if (!USER_HANDLE.test(raw)) continue;
    out.push({ kind: "user", handle: raw, start, end });
  }
  return out;
}

/**
 * Convert @-mentions to renderable HTML chunks. Resolved mentions become a
 * `<span class="mention" data-kind=…>` element; unresolved mentions are left
 * as plain text. The base text is HTML-escaped.
 */
export function renderMentionsToHtml(
  text: string,
  lookup: (m: ParsedMention) => { kind: "user" | "team"; id: string; name: string } | null,
): string {
  if (!text) return "";
  const mentions = parseMentions(text);
  if (mentions.length === 0) return escapeHtml(text);

  let cursor = 0;
  let out = "";
  for (const m of mentions) {
    if (m.start > cursor) out += escapeHtml(text.slice(cursor, m.start));
    const resolved = lookup(m);
    if (resolved) {
      out +=
        `<span class="mention" data-kind="${resolved.kind}" data-id="${escapeAttr(resolved.id)}">` +
        `@${escapeHtml(resolved.name)}` +
        `</span>`;
    } else {
      out += escapeHtml(text.slice(m.start, m.end));
    }
    cursor = m.end;
  }
  if (cursor < text.length) out += escapeHtml(text.slice(cursor));
  return out;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}

// ────────────────────────────────────────────────────────────────────
// Resolution — Phase 5.1 (Teams)
// ────────────────────────────────────────────────────────────────────

/**
 * A resolved mention. `id` is the canonical principal id (user_id for
 * `kind: 'user'`, team_id for `kind: 'team'`). `name` is the display label.
 * `members` is populated only for team mentions and lists the user_ids the
 * team currently expands to — server actions writing into `annotations.metadata.mentions`
 * use this to fan a team mention out into per-user notification rows so the
 * existing `annotations_notify()` trigger picks each member up as a regular
 * `kind: 'user'` mention.
 */
export type ResolvedMention = {
  kind: "user" | "team";
  id: string;
  name: string;
  /** Only set for team mentions. */
  members?: string[];
};

/**
 * Asynchronous resolver contract. Implementations look up users by handle
 * (the `users.username` column) and teams by slug within the caller's org.
 * Server actions wire this to a Supabase query; tests mock it.
 */
export type MentionResolver = (m: ParsedMention) => Promise<ResolvedMention | null>;

/**
 * Resolve every parsed mention in a single pass. Skips mentions that the
 * resolver can't find (returns null). Order is preserved so callers can
 * reuse the result alongside the original parsed list.
 */
export async function resolveMentions(parsed: ParsedMention[], resolve: MentionResolver): Promise<ResolvedMention[]> {
  if (parsed.length === 0) return [];
  const out: ResolvedMention[] = [];
  for (const m of parsed) {
    const r = await resolve(m);
    if (r) out.push(r);
  }
  return out;
}

/**
 * Expand a list of resolved mentions into the JSONB array shape stored in
 * `annotations.metadata.mentions`. Team mentions are expanded into per-user
 * entries (one row per `team_members.user_id`) so the existing
 * `annotations_notify()` trigger — which only fans out `kind: 'user'`
 * entries — delivers a notification to every team member. The original
 * team mention is preserved as a `kind: 'team'` entry so renderers can
 * still highlight the team chip in the comment body.
 *
 * Each expanded user entry carries an `origin_team_id` field so downstream
 * UI (notification inbox) can attribute "you were @-mentioned via @team-prod"
 * if it wants to. Self-fan-out is the trigger's job (it skips the actor).
 */
export function expandMentionsForStorage(
  resolved: ResolvedMention[],
): Array<{ kind: "user" | "team"; id: string; handle: string; origin_team_id?: string }> {
  const seenUsers = new Set<string>();
  const out: Array<{ kind: "user" | "team"; id: string; handle: string; origin_team_id?: string }> = [];

  for (const r of resolved) {
    if (r.kind === "user") {
      if (seenUsers.has(r.id)) continue;
      seenUsers.add(r.id);
      out.push({ kind: "user", id: r.id, handle: r.name });
      continue;
    }
    // Team mention: keep the team entry (for rendering) AND fan out to
    // per-user entries (so the notify trigger picks them up).
    out.push({ kind: "team", id: r.id, handle: r.name });
    for (const memberId of r.members ?? []) {
      if (seenUsers.has(memberId)) continue;
      seenUsers.add(memberId);
      out.push({ kind: "user", id: memberId, handle: r.name, origin_team_id: r.id });
    }
  }

  return out;
}
