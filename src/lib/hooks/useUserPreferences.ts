"use client";

import { useCallback, useEffect, useState } from "react";

export type UserPreferences = {
  theme?: "light" | "dark" | "system";
  density?: "comfortable" | "compact";
  locale?: string;
  timezone?: string;
  last_org_id?: string | null;
  table_views?: Record<string, unknown>;
  consent?: { essential?: boolean; analytics?: boolean; marketing?: boolean };
  palette_recents?: string[];
  sidebar_width?: number;
  sidebar_pinned?: string[];
  sidebar_collapsed?: boolean;
  /** Nav group labels the user has explicitly expanded. Allow-list — the
   *  default sidebar shape is "all groups collapsed; show only pinned items
   *  and the active-route group's contents". User toggles surface here. */
  sidebar_expanded_groups?: string[];
  /** ADR-0006: console sidebar mode. "domain" = 7-group domain-noun
   *  (operator default); "xpms" = ADR-0004 XPMS-numeric spine. */
  nav_mode?: "domain" | "xpms";
  /** ADR-0009: persisted mobile role. Drives the tab bar + role home
   *  on COMPVSS once the dedicated persona-routing PR lands. */
  mobile_role?: "performer" | "crew" | "driver" | "medic" | "guard" | "admin";
  /** ADR-0007: last-visited portal slug — used by the app switcher to
   *  deep-link the GVTEWAY entry to where the user was last. */
  last_portal_slug?: string;
};

let cache: UserPreferences | null = null;
const listeners = new Set<(prefs: UserPreferences) => void>();

async function fetchPrefs(): Promise<UserPreferences> {
  try {
    const res = await fetch("/api/v1/me/preferences");
    if (!res.ok) return {};
    const json = (await res.json()) as { ok: boolean; data?: UserPreferences | null };
    return json.data ?? {};
  } catch {
    return {};
  }
}

async function writePrefs(patch: Partial<UserPreferences>): Promise<UserPreferences> {
  try {
    const res = await fetch("/api/v1/me/preferences", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) return cache ?? {};
    const json = (await res.json()) as { ok: boolean; data?: UserPreferences };
    return json.data ?? cache ?? {};
  } catch {
    return cache ?? {};
  }
}

/**
 * Shared user preferences cache with optimistic updates.
 * SSOT: user_preferences table; RLS-scoped to the caller.
 */
export function useUserPreferences(): {
  prefs: UserPreferences;
  setPrefs: (patch: Partial<UserPreferences>) => Promise<void>;
  loading: boolean;
} {
  const [prefs, setLocal] = useState<UserPreferences>(cache ?? {});
  const [loading, setLoading] = useState(cache == null);

  useEffect(() => {
    if (cache != null) return;
    let cancelled = false;
    void fetchPrefs().then((p) => {
      if (cancelled) return;
      cache = p;
      setLocal(p);
      setLoading(false);
      listeners.forEach((fn) => fn(p));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const fn = (p: UserPreferences) => setLocal(p);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  const setPrefs = useCallback(async (patch: Partial<UserPreferences>) => {
    const optimistic = { ...(cache ?? {}), ...patch };
    cache = optimistic;
    setLocal(optimistic);
    listeners.forEach((fn) => fn(optimistic));
    const written = await writePrefs(patch);
    cache = written;
    listeners.forEach((fn) => fn(written));
  }, []);

  return { prefs, setPrefs, loading };
}
