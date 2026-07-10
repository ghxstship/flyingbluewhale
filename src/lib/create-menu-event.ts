/**
 * Imperative open channel for the One Front Door CreateMenu (F-04).
 *
 * The `c` hotkey (GlobalNavShortcuts in ShortcutDialog.tsx) dispatches this
 * window CustomEvent; CreateMenu listens and opens its popover. A plain event
 * keeps the two components decoupled — no context plumbing through the
 * workspace chrome.
 */
export const CREATE_MENU_OPEN_EVENT = "atlvs:create-menu:open";

export function openCreateMenu() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CREATE_MENU_OPEN_EVENT));
  }
}
