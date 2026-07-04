"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KIcon } from "@/components/mobile/kit";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  removeConnection,
  requestConnection,
  respondConnection,
} from "./actions";

export type ConnectionRow = {
  id: string;
  userId: string;
  name: string;
  av: string;
  role: string;
  state: string;
};

export type Suggestion = {
  userId: string;
  name: string;
  av: string;
  role: string;
  tags: string[];
};

type Labels = {
  search: string;
  sectionNetwork: string;
  sectionPending: string;
  sectionSuggestions: string;
  emptyTitle: string;
  emptyBody: string;
  connect: string;
  accept: string;
  decline: string;
  remove: string;
  requestSent: string;
  connected: string;
};

export function ConnectionsView({
  network,
  pending,
  suggestions,
  labels,
}: {
  network: ConnectionRow[];
  pending: ConnectionRow[];
  suggestions: Suggestion[];
  labels: Labels;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pendingTx, startTx] = useTransition();
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const matches = useCallback(
    (s: string) => !query || s.toLowerCase().includes(query.toLowerCase()),
    [query],
  );

  const fNetwork = useMemo(
    () => network.filter((c) => matches(`${c.name} ${c.role}`)),
    [network, matches],
  );
  const fPending = useMemo(
    () => pending.filter((c) => matches(`${c.name} ${c.role}`)),
    [pending, matches],
  );
  const fSuggestions = useMemo(
    () =>
      suggestions
        .filter((c) => !sent.has(c.userId))
        .filter((c) => matches(`${c.name} ${c.role} ${c.tags.join(" ")}`)),
    [suggestions, matches, sent],
  );

  const run = (action: () => Promise<{ error?: string } | null>) => {
    setError(null);
    startTx(async () => {
      const res = await action();
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  };

  const fd = (entries: Record<string, string>) => {
    const f = new FormData();
    for (const [k, v] of Object.entries(entries)) f.set(k, v);
    return f;
  };

  const onConnect = (userId: string) => {
    setSent((s) => new Set(s).add(userId));
    run(() => requestConnection(null, fd({ addresseeUserId: userId })));
  };

  const empty = !fNetwork.length && !fPending.length && !fSuggestions.length;

  return (
    <>
      <div className="searchbar" style={{ marginBottom: 12 }}>
        <KIcon name="Search" size={16} style={{ color: "var(--p-text-3)" }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={labels.search}
          aria-label={labels.search}
        />
      </div>

      {error && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      {fPending.length > 0 && (
        <>
          <div className="sech">
            <h2>
              {labels.sectionPending} · {fPending.length}
            </h2>
          </div>
          {fPending.map((c) => (
            <div className="item" key={c.id} style={{ display: "block" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className="avatar-sm" style={{ width: 44, height: 44, fontSize: 14 }}>
                  {c.av}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="t">{c.name}</div>
                  <div className="s">{c.role}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button
                  type="button"
                  className="ps-btn ps-btn--cta ps-btn--sm"
                  disabled={pendingTx}
                  style={{ flex: 1, justifyContent: "center" }}
                  onClick={() => run(() => respondConnection(null, fd({ id: c.id, accept: "true" })))}
                >
                  <KIcon name="Check" size={14} /> {labels.accept}
                </button>
                <button
                  type="button"
                  className="ps-btn ps-btn--secondary ps-btn--sm"
                  disabled={pendingTx}
                  style={{ flex: 1, justifyContent: "center" }}
                  onClick={() => run(() => respondConnection(null, fd({ id: c.id, accept: "false" })))}
                >
                  {labels.decline}
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {fNetwork.length > 0 && (
        <>
          <div className="sech">
            <h2>
              {labels.sectionNetwork} · {fNetwork.length}
            </h2>
          </div>
          {fNetwork.map((c) => (
            <div className="item" key={c.id} style={{ display: "block" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className="avatar-sm" style={{ width: 44, height: 44, fontSize: 14 }}>
                  {c.av}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="t">{c.name}</div>
                  <div className="s">{c.role}</div>
                </div>
                <span className="ps-badge ps-badge--ok">{labels.connected}</span>
                <button
                  type="button"
                  className="iconbtn"
                  aria-label={labels.remove}
                  disabled={pendingTx}
                  onClick={() => run(() => removeConnection(null, fd({ id: c.id })))}
                >
                  <KIcon name="X" size={15} />
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {fSuggestions.length > 0 && (
        <>
          <div className="sech">
            <h2>
              {labels.sectionSuggestions} · {fSuggestions.length}
            </h2>
          </div>
          {fSuggestions.map((c) => (
            <div className="item" key={c.userId} style={{ display: "block" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className="avatar-sm" style={{ width: 44, height: 44, fontSize: 14 }}>
                  {c.av}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="t">{c.name}</div>
                  <div className="s">{c.role}</div>
                </div>
                <button
                  type="button"
                  className="ps-btn ps-btn--cta ps-btn--sm"
                  disabled={pendingTx}
                  onClick={() => onConnect(c.userId)}
                >
                  <KIcon name="UserPlus" size={14} /> {labels.connect}
                </button>
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
          ))}
        </>
      )}

      {empty && <EmptyState title={labels.emptyTitle} description={labels.emptyBody} />}
    </>
  );
}
