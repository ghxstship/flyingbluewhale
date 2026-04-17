'use client';

/** ViewTypeSwitcher — toggle between view types (table, board, grid, etc.) */

export function getPersistedView(key: string, allowed: string[], fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = localStorage.getItem(`viewType:${key}`);
    if (saved && allowed.includes(saved)) return saved;
  } catch {/* ignore */}
  return fallback;
}

export function ViewTypeSwitcher({ children, ...props }: any) {
  return <div data-component="ViewTypeSwitcher" {...props}>{children}</div>;
}

export default ViewTypeSwitcher;
