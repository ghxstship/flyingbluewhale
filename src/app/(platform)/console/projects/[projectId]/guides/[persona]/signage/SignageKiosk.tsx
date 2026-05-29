"use client";

import { useEffect, useState, useCallback } from "react";

type Section = {
  kind: string;
  title?: string;
  items?: Array<{ time?: string; label?: string; description?: string; [k: string]: unknown }>;
  body?: string;
};

type FeedPayload = {
  guide_id: string;
  title: string;
  persona: string;
  served_at: string;
  sections: Section[];
};

const REFRESH_MS = 30_000;

function Clock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => {
      setTime(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }),
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span>{time}</span>;
}

export function SignageKiosk({
  guideId,
  projectName,
  persona,
}: {
  guideId: string;
  projectName: string;
  persona: string;
}) {
  const [feed, setFeed] = useState<FeedPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/signage/${guideId}`, { cache: "no-store" });
      if (!res.ok) {
        setError(`Feed returned ${res.status}`);
        return;
      }
      const data = (await res.json()) as FeedPayload;
      setFeed(data);
      setError(null);
    } catch {
      setError("Network error — will retry");
    }
  }, [guideId]);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), REFRESH_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const now = new Date().toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className="fixed inset-0 flex flex-col bg-[var(--bg-base)] text-[var(--foreground)]"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {/* Header bar */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-[var(--border)] bg-[var(--bg-raised)]">
        <div>
          <div className="text-xs font-semibold tracking-widest text-[var(--text-muted)] uppercase">
            A T L V S · {projectName}
          </div>
          <div className="mt-1 text-lg font-bold">{feed?.title ?? "Event Guide"}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-mono font-semibold tabular-nums">
            <Clock />
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-0.5">{now}</div>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 overflow-auto px-8 py-6 space-y-6">
        {error && (
          <div className="surface-inset rounded-lg p-4 text-sm text-[var(--warning)]">⚠ {error}</div>
        )}

        {!feed && !error && (
          <div className="flex h-full items-center justify-center text-[var(--text-muted)]">
            Loading feed…
          </div>
        )}

        {feed?.sections.map((section, i) => (
          <section key={i} className="surface rounded-xl p-6">
            <h2 className="mb-4 text-xs font-semibold tracking-widest uppercase text-[var(--text-muted)]">
              {section.title ?? section.kind}
            </h2>

            {section.body && (
              <p className="text-sm whitespace-pre-wrap text-[var(--text-primary)]">{section.body}</p>
            )}

            {section.items && section.items.length > 0 && (
              <div className="divide-y divide-[var(--border)]">
                {section.items.map((item, ii) => (
                  <div key={ii} className="flex items-start gap-6 py-3">
                    {item.time && (
                      <span className="w-20 shrink-0 font-mono text-sm font-semibold text-[var(--brand)]">
                        {item.time}
                      </span>
                    )}
                    <div>
                      <div className="text-sm font-semibold">{item.label ?? "—"}</div>
                      {item.description && (
                        <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </main>

      {/* Footer */}
      <footer className="px-8 py-3 border-t border-[var(--border)] bg-[var(--bg-raised)] flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span>
          {persona.toUpperCase()} GUIDE · Auto-refreshes every {REFRESH_MS / 1000}s
        </span>
        {feed?.served_at && (
          <span>Last updated {new Date(feed.served_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        )}
      </footer>
    </div>
  );
}
