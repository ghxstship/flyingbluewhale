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
