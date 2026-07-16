"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { KIcon } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createMobileChannel, startMobileDm } from "../actions";

export type MemberOption = { id: string; name: string };

/**
 * New Message compose — a kit `seg2` segmented choice (Direct Message |
 * Channel) over the two create paths. DM first: on a field device the
 * overwhelmingly common case is "message a person", not "found a channel".
 */
export function NewMessageView({
  members,
  eyebrow,
  title,
}: {
  members: MemberOption[];
  eyebrow: string;
  title: string;
}) {
  const t = useT();
  const [mode, setMode] = useState<"dm" | "channel">("dm");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [q, setQ] = useState("");

  const submit = () => {
    if (pending) return;
    setError(null);
    const fd = new FormData();
    startTransition(async () => {
      // Success never returns — the action redirect()s into the new room.
      const res =
        mode === "dm"
          ? (fd.set("userId", userId), await startMobileDm(null, fd))
          : (fd.set("name", name), await createMobileChannel(null, fd));
      if (res?.error) setError(res.error);
    });
  };

  const visible = members.filter((m) => !q || m.name.toLowerCase().includes(q.toLowerCase()));
  const ready = mode === "dm" ? Boolean(userId) : name.trim().length > 0;

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{eyebrow}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {title}
      </h1>

      {error && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      <div className="seg2" style={{ marginBottom: 12 }}>
        <button type="button" data-on={mode === "dm" ? true : undefined} onClick={() => setMode("dm")}>
          {t("m.inbox.dm", undefined, "Direct Message")}
        </button>
        <button type="button" data-on={mode === "channel" ? true : undefined} onClick={() => setMode("channel")}>
          {t("m.inbox.channel", undefined, "Channel")}
        </button>
      </div>

      {mode === "dm" ? (
        <>
          <div className="searchbar" style={{ marginBottom: 8 }}>
            <KIcon name="Search" size={16} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("m.inbox.searchPeople", undefined, "Search People…")}
              aria-label={t("m.inbox.searchPeople", undefined, "Search People…")}
            />
          </div>
          {visible.map((m) => (
            <button
              key={m.id}
              type="button"
              className="item tap"
              style={{ cursor: "pointer", width: "100%", textAlign: "left" }}
              onClick={() => setUserId(m.id)}
            >
              <span className="avatar-sm">
                {m.name
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((w) => w[0]?.toUpperCase() ?? "")
                  .join("")}
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="t">{m.name}</div>
              </div>
              {userId === m.id && <KIcon name="Check" size={18} style={{ color: "var(--p-success)" }} />}
            </button>
          ))}
          {!visible.length && (
            <div className="s" style={{ color: "var(--p-text-3)", padding: "8px 2px" }}>
              {t("m.inbox.noPeople", undefined, "Nobody matches that search.")}
            </div>
          )}
        </>
      ) : (
        <div className="fld">
          <label className="lbl" htmlFor="channel-name">
            {t("m.inbox.channelName", undefined, "Channel Name")}
          </label>
          <input
            id="channel-name"
            className="ps-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder={t("m.inbox.channelPlaceholder", undefined, "e.g. gate-access")}
          />
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <Link href="/m/inbox" className="ps-btn ps-btn--tertiary ps-btn--lg" style={{ flex: 1, justifyContent: "center" }}>
          {t("common.cancel", undefined, "Cancel")}
        </Link>
        <button
          type="button"
          className="ps-btn ps-btn--cta ps-btn--lg"
          style={{ flex: 2, justifyContent: "center", opacity: ready ? 1 : 0.5 }}
          disabled={pending || !ready}
          onClick={submit}
        >
          <KIcon name="Send" size={15} />{" "}
          {pending ? t("m.inbox.starting", undefined, "Starting…") : t("m.inbox.start", undefined, "Start Conversation")}
        </button>
      </div>
    </div>
  );
}
