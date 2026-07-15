"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { KIcon } from "@/components/mobile/kit";
import { searchMobile } from "@/app/(mobile)/search-actions";

/**
 * COMPVSS global search — kit 28 `{searchOpen && …}` (runtime/app.jsx).
 *
 * A full-screen `.formscreen` overlay, not a route. The app bar's search button
 * used to push `/m/search`, which does not exist — it 404'd from every screen
 * in the app. The kit never had a search page; it has this.
 *
 * Results are grouped (Tasks · Assets · Calendar · Jobs) with a count per
 * group, matching the kit's `.grph` group headers. Queries go through a server
 * action so the sheet doesn't need every store preloaded into the shell.
 */
type Hit = { icon: string; title: string; sub: string; href: string };
type Group = { label: string; hits: Hit[] };

export function MobileSearchSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [groups, setGroups] = React.useState<Group[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Debounced: a field device on a bad network should not fire a request per
  // keystroke.
  React.useEffect(() => {
    if (!open || !q.trim()) {
      setGroups([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const id = setTimeout(async () => {
      try {
        const json = await searchMobile(q);
        if (!cancelled) setGroups(json.groups ?? []);
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
  }, [q, open]);

  if (!open) return null;

  const total = groups.reduce((n, g) => n + g.hits.length, 0);

  const go = (href: string) => {
    onClose();
    setQ("");
    router.push(href);
  };

  return (
    <div className="formscreen" style={{ padding: "14px 18px 28px" }} role="dialog" aria-modal="true" aria-label="Search">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div className="searchbar" style={{ flex: 1 }}>
          <Search size={16} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search everything…"
            aria-label="Search everything"
          />
        </div>
        <button
          type="button"
          className="pill"
          onClick={() => {
            onClose();
            setQ("");
          }}
        >
          Cancel
        </button>
      </div>

      {!q.trim() ? (
        <div className="s" style={{ color: "var(--p-text-3)", padding: "8px 2px" }}>
          Search tasks, assets, your calendar and open jobs.
        </div>
      ) : loading ? (
        <div className="s" style={{ color: "var(--p-text-3)", padding: "8px 2px" }}>
          Searching…
        </div>
      ) : total === 0 ? (
        <div className="s" style={{ color: "var(--p-text-3)", padding: "8px 2px" }}>
          Nothing matches “{q}”.
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
    </div>
  );
}
