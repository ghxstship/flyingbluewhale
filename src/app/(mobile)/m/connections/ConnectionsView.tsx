"use client";

import { useMemo, useState } from "react";
import { ActionBar, DataTable, KIcon } from "@/components/mobile/kit";
import type { ViewMode } from "@/components/mobile/kit";
import { EmptyState } from "@/components/ui/EmptyState";

export type Connection = {
  id: string;
  name: string;
  av: string;
  role: string;
  region: string;
  tags: string[];
  mutual: number;
  status: "connected" | "pending" | "connect";
};

type Labels = {
  search: string;
  emptyTitle: string;
  emptyBody: string;
  connect: string;
  pending: string;
  requestSent: string;
};

export function ConnectionsView({
  connections,
  labels,
}: {
  connections: Connection[];
  labels: Labels;
}) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("list");
  const [sort, setSort] = useState("mutual");
  const [tags, setTags] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());

  const allTags = useMemo(() => [...new Set(connections.flatMap((c) => c.tags))], [connections]);

  const items = useMemo(() => {
    return connections
      .filter((c) => tags.size === 0 || c.tags.some((t) => tags.has(t)))
      .filter(
        (c) =>
          !query ||
          (c.name + " " + c.role + " " + c.region + " " + c.tags.join(" "))
            .toLowerCase()
            .includes(query.toLowerCase()),
      )
      .sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name) : b.mutual - a.mutual));
  }, [connections, tags, query, sort]);

  return (
    <>
      <ActionBar
        k="cn"
        query={query}
        setQuery={setQuery}
        placeholder={labels.search}
        view={view}
        setView={setView}
        views={["list", "gallery", "table"]}
        sort={sort}
        setSort={setSort}
        sortOpts={[
          ["mutual", "Mutual"],
          ["name", "Name"],
        ]}
        filterActive={tags.size}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        filterChildren={
          <>
            <div className="wl" style={{ marginBottom: 8 }}>
              Trade · Skill · Cert
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 10 }}>
              {allTags.map((tg) => (
                <button
                  type="button"
                  key={tg}
                  className={`chip ${tags.has(tg) ? "on" : ""}`}
                  onClick={() =>
                    setTags((p) => {
                      const n = new Set(p);
                      n.has(tg) ? n.delete(tg) : n.add(tg);
                      return n;
                    })
                  }
                >
                  {tg}
                </button>
              ))}
            </div>
            <button type="button"
              className="pill"
              style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
              onClick={() => setTags(new Set())}
            >
              Reset Filters
            </button>
          </>
        }
      />

      {view === "gallery" ? (
        <div className="gal-grid">
          {items.map((c) => (
            <div className="gal-card" key={c.id}>
              <span className="gal-av">{c.av}</span>
              <div className="t" style={{ fontSize: 12.5, textAlign: "center", marginTop: 8 }}>
                {c.name}
              </div>
              <div className="s" style={{ fontSize: 10.5, textAlign: "center" }}>
                {c.role}
              </div>
            </div>
          ))}
        </div>
      ) : view === "table" ? (
        <DataTable
          fields={[
            { id: "name", label: "Name", type: "text", get: (x: Connection) => x.name },
            { id: "role", label: "Role", type: "text", get: (x: Connection) => x.role },
            {
              id: "status",
              label: "Status",
              type: "text",
              get: (x: Connection) => (sent.has(x.id) ? "Requested" : x.status),
            },
          ]}
          items={items}
        />
      ) : (
        items.map((c) => (
          <div className="item tap" key={c.id} style={{ display: "block" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="avatar-sm" style={{ width: 44, height: 44, fontSize: 14 }}>
                {c.av}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="t">{c.name}</div>
                <div className="s">
                  {c.role}
                  {c.region ? ` · ${c.region}` : ""}
                </div>
              </div>
              {c.status === "pending" || sent.has(c.id) ? (
                <span className="ps-badge ps-badge--warn">
                  {sent.has(c.id) ? labels.requestSent : labels.pending}
                </span>
              ) : (
                <button type="button"
                  className="ps-btn ps-btn--cta ps-btn--sm"
                  onClick={() => setSent((s) => new Set(s).add(c.id))}
                >
                  <KIcon name="UserPlus" size={14} /> {labels.connect}
                </button>
              )}
            </div>
            {c.tags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                {c.tags.map((tg) => (
                  <span className="tag-chip" key={tg}>
                    {tg}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))
      )}

      {!items.length && <EmptyState title={labels.emptyTitle} description={labels.emptyBody} />}
    </>
  );
}
