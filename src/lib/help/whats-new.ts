import { CHANGELOG_ENTRIES } from "@/lib/changelog";

/**
 * What's New unread state (kit 21 W6). The newest changelog version is the
 * "latest release"; the console persists the last version the operator has
 * seen in localStorage, and the Help icon carries an unread dot until they
 * open What's New. Client-only (localStorage) — no server round-trip, matches
 * the kit's "cleared on first visit, persisted" contract.
 */
export const WHATS_NEW_SEEN_KEY = "atlvs.whatsNew.seenVersion";

/** Newest release version (changelog is authored newest-first). */
export const LATEST_RELEASE_VERSION = CHANGELOG_ENTRIES[0]?.version ?? "";

export function getSeenVersion(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(WHATS_NEW_SEEN_KEY);
  } catch {
    return null;
  }
}

export function markWhatsNewSeen(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(WHATS_NEW_SEEN_KEY, LATEST_RELEASE_VERSION);
    // Let the Help icon in the same tab clear its dot without a reload.
    window.dispatchEvent(new CustomEvent("atlvs:whatsNewSeen"));
  } catch {
    // localStorage blocked (private mode) — the dot just stays; harmless.
  }
}
