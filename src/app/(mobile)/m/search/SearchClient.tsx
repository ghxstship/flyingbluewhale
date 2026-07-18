"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { KIcon } from "@/components/mobile/kit";
import { searchMobile, type SearchGroup, type SearchScope } from "@/app/(mobile)/search-actions";

/**
 * COMPVSS · Global Search — kit 29 (Conformance Spec, ratified 2026-07-17).
 *
 * The spec promoted Global Search from the kit-28 overlay drawer to a
 * first-class /m/search route reached from the top bar: app-wide across
 * tasks, people, assets, docs and spaces, with recents + scoped filters.
 * Queries go through the searchMobile server action so the screen doesn't
 * need every store preloaded into the shell.
 */

const SCOPES: Array<{ key: SearchScope; label: string }> = [
  { key: "all", label: "All" },
  { key: "tasks", label: "Tasks" },
  { key: "people", label: "People" },
  { key: "assets", label: "Assets" },
  { key: "docs", label: "Docs" },
  { key: "templates", label: "Templates" },
  { key: "spaces", label: "Spaces" },
];

const RECENTS_KEY = "compvss.search.recents";
const RECENTS_MAX = 8;

function readRecents(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENTS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string").slice(0, RECENTS_MAX) : [];
  } catch {
    return [];
  }
}

function pushRecent(q: string) {
  try {
    const next = [q, ...readRecents().filter((r) => r.toLowerCase() !== q.toLowerCase())].slice(0, RECENTS_MAX);
    window.localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch {
    // Storage full / private mode — recents are a convenience, not state.
  }
}

export function SearchClient({
  placeholder,
  emptyHint,
  recentsLabel,
  clearLabel,
  searchingLabel,
  noMatchLabel,
}: {
  placeholder: string;
  emptyHint: string;
  recentsLabel: string;
  clearLabel: string;
  searchingLabel: string;
  noMatchLabel: string;
}) {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [scope, setScope] = React.useState<SearchScope>("all");
  const [groups, setGroups] = React.useState<SearchGroup[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [recents, setRecents] = React.useState<string[]>([]);

  React.useEffect(() => {
    setRecents(readRecents());
  }, []);

  // Debounced: a field device on a bad network should not fire a request per
  // keystroke.
  React.useEffect(() => {
    if (!q.trim()) {
      setGroups([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const id = setTimeout(async () => {
      try {
        const json = await searchMobile(q, scope);
        if (!cancelled) {
          setGroups(json.groups ?? []);
          pushRecent(q.trim());
          setRecents(readRecents());
        }
      } catch {
        if (!cancelled) setGroups([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [q, scope]);

  const total = groups.reduce((n, g) => n + g.hits.length, 0);

  const go = (href: string) => {
    router.push(href);
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div className="searchbar" style={{ flex: 1 }}>
          <Search size={16} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
          />
        </div>
      </div>

      {/* Scoped filters — the spec's scope chips. */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {SCOPES.map((s) => (
          <button
            key={s.key}
            type="button"
            className="pill"
            aria-pressed={scope === s.key}
            style={
              scope === s.key
                ? {
                    background: "var(--p-accent-100)",
                    borderColor: "var(--p-accent-500)",
                    color: "var(--p-accent-text)",
                  }
                : undefined
            }
            onClick={() => setScope(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {!q.trim() ? (
        <>
          <div className="s" style={{ color: "var(--p-text-3)", padding: "8px 2px" }}>
            {emptyHint}
          </div>
          {recents.length > 0 && (
            <div>
              <div className="grph">
                {recentsLabel}
                <button
                  type="button"
                  className="pill"
                  style={{ marginInlineStart: "auto" }}
                  onClick={() => {
                    try {
                      window.localStorage.removeItem(RECENTS_KEY);
                    } catch {
                      // best-effort
                    }
                    setRecents([]);
                  }}
                >
                  {clearLabel}
                </button>
              </div>
              {recents.map((r) => (
                <button
                  type="button"
                  className="item tap"
                  key={r}
                  style={{ cursor: "pointer", width: "100%", textAlign: "left" }}
                  onClick={() => setQ(r)}
                >
                  <KIcon name="History" size={17} style={{ color: "var(--p-text-2)", flex: "none" }} />
                  <div style={{ minWidth: 0 }}>
                    <div className="t">{r}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      ) : loading ? (
        <div className="s" style={{ color: "var(--p-text-3)", padding: "8px 2px" }}>
          {searchingLabel}
        </div>
      ) : total === 0 ? (
        <div className="s" style={{ color: "var(--p-text-3)", padding: "8px 2px" }}>
          {noMatchLabel.replace("{q}", q)}
        </div>
      ) : (
        groups
          .filter((g) => g.hits.length)
          .map((g) => (
            <div key={g.label}>
              <div className="grph">
                {g.label}
                <span className="gc">{g.hits.length}</span>
              </div>
              {g.hits.map((h) => (
                <button
                  type="button"
                  className="item tap"
                  key={h.href + h.title}
                  style={{ cursor: "pointer", width: "100%", textAlign: "left" }}
                  onClick={() => go(h.href)}
                >
                  <KIcon name={h.icon} size={17} style={{ color: "var(--p-text-2)", flex: "none" }} />
                  <div style={{ minWidth: 0 }}>
                    <div className="t">{h.title}</div>
                    <div className="s">{h.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          ))
      )}
    </>
  );
}
