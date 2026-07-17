"use client";

import { useMemo, useState } from "react";
import { ActionBar, KIcon, TogRow } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";
import { AcknowledgeButton } from "./AcknowledgeButton";

/**
 * AlertsList — client leaf for /m/notifications (the bell feed; it wore
 * /m/alerts before kit 28, and kit 29 gave that path to the crisis alert
 * log). Adds the kit ActionBar (search +
 * sort + unread/tone filter cluster) over the notification rows the server
 * page shapes (audit D-22; KIT_CANON: ActionBar on every list screen).
 */

export type AlertItem = {
  id: string;
  title: string;
  body: string;
  tone: "warn" | "ok" | "info" | "neutral";
  color: string;
  iconName: string;
  when: string;
  read: boolean;
  sortAt: string;
};

export function AlertsList({ items }: { items: AlertItem[] }) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [tones, setTones] = useState<Set<AlertItem["tone"]>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const toggleTone = (tone: AlertItem["tone"]) =>
    setTones((s) => {
      const n = new Set(s);
      if (n.has(tone)) n.delete(tone);
      else n.add(tone);
      return n;
    });

  const toneLabels: Record<AlertItem["tone"], string> = {
    warn: t("m.alerts.filter.urgent", undefined, "Urgent"),
    ok: t("m.alerts.filter.approvals", undefined, "Approvals"),
    info: t("m.alerts.filter.updates", undefined, "Updates"),
    neutral: t("m.alerts.filter.general", undefined, "General"),
  };
  const presentTones = useMemo(
    () => (["warn", "ok", "info", "neutral"] as const).filter((tn) => items.some((i) => i.tone === tn)),
    [items],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = items.filter(
      (i) =>
        (!q || `${i.title} ${i.body}`.toLowerCase().includes(q)) &&
        (!unreadOnly || !i.read) &&
        (tones.size === 0 || tones.has(i.tone)),
    );
    return sort === "oldest"
      ? filtered.slice().sort((a, b) => a.sortAt.localeCompare(b.sortAt))
      : filtered.slice().sort((a, b) => b.sortAt.localeCompare(a.sortAt));
  }, [items, query, sort, unreadOnly, tones]);

  if (items.length === 0) {
    return (
      <div className="item">
        <div className="s">{t("m.alerts.emptyTitle", undefined, "All clear. No alerts right now.")}</div>
      </div>
    );
  }

  return (
    <>
      <ActionBar
        k="alerts"
        query={query}
        setQuery={setQuery}
        placeholder={t("m.alerts.search", undefined, "Search alerts…")}
        sort={sort}
        setSort={setSort}
        sortOpts={[
          ["newest", t("m.alerts.sort.newest", undefined, "Newest")],
          ["oldest", t("m.alerts.sort.oldest", undefined, "Oldest")],
        ]}
        filterActive={tones.size + (unreadOnly ? 1 : 0)}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        filterChildren={
          <div>
            <TogRow
              label={t("m.alerts.filter.unread", undefined, "Unread Only")}
              on={unreadOnly}
              set={() => setUnreadOnly((v) => !v)}
            />
            {presentTones.map((tn) => (
              <TogRow key={tn} label={toneLabels[tn]} on={tones.has(tn)} set={() => toggleTone(tn)} />
            ))}
          </div>
        }
      />

      {visible.length === 0 ? (
        <div className="s" style={{ color: "var(--p-text-3)", padding: "16px 4px" }}>
          {t("m.alerts.noMatch", undefined, "Nothing matches your search.")}
        </div>
      ) : (
        visible.map((a) => (
          <div className="item" key={a.id} style={{ display: "block", opacity: a.read ? 0.65 : 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="bar" style={{ background: a.color }} />
              <KIcon name={a.iconName} size={18} style={{ color: a.color }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="t">{a.title}</div>
                <div className="s">{a.body}</div>
              </div>
              <span className="time">{a.when}</span>
            </div>
            {!a.read && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                <AcknowledgeButton alertId={a.id} />
              </div>
            )}
          </div>
        ))
      )}
    </>
  );
}
