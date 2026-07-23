"use client";

import * as React from "react";
import { KIcon } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Aurora AI — the full-screen agentic-chat surface (kit 33 v3.0, the 5th tab).
 *
 * Claude-conversation layout: greeting + suggested-prompt cards, user turns as
 * trailing bubbles, assistant turns as a left-avatar prose block with a
 * "Consulted <source>" tool-trace line + inline follow-up suggestions, and a
 * rounded pinned composer with a New-Chat reset.
 *
 * Backend is a **deterministic offline guide** (`answerFor` / `toolFor`) — it
 * does NOT read the caller's live data or take actions. Every answer is honest
 * navigational guidance ("your shifts live on the Schedule tab") that points at
 * a real surface, never a fabricated specific value. Per README v3.0 the future
 * agent runtime is heybrio.ai (https://heybrio.ai/) — when it lands, wire the
 * composer, tool-trace, and follow-ups to its API so answers become live.
 */

type Msg = { me: true; txt: string } | { me: false; txt: string; tool: string };

/** The client translator shape (`useT()`), threaded into the deterministic guide. */
type Tr = (key: string, vars?: Record<string, string | number>, fallback?: string) => string;

function answerFor(t: Tr, q: string): string {
  const s = q.toLowerCase();
  if (/next shift|when.*work|schedule/.test(s))
    return t("m.aurora.ansShift", undefined, "Your shifts live on the Schedule tab. Open it to see your next call, its location and times. Tap a shift for the full brief.");
  if (/incident|report|injur|hazard/.test(s))
    return t("m.aurora.ansIncident", undefined, "To file an incident: open Tasks then Report It (also under Quick Actions on Home). Pick a type, set severity, add a photo, and it routes to Ops.");
  if (/convert|ft|feet|meter|metre|lb|kg/.test(s))
    return t("m.aurora.ansConvert", undefined, "The Unit Converter is in your Toolbox. It handles length, weight and temperature for quick on-site math.");
  if (/cater|food|meal|eat/.test(s))
    return t("m.aurora.ansCatering", undefined, "Meal service times and your meal voucher are on your Rose and in the venue guide. Check Access & Rose for the voucher.");
  if (/radio|channel/.test(s))
    return t("m.aurora.ansRadio", undefined, "Radio channel assignments are in the Toolbox under Radio Channels, and on the shift brief for the zone you're working.");
  if (/pass|credential|access|rose/.test(s))
    return t("m.aurora.ansRose", undefined, "Your Rose (credential) is on the Home tab. Open it to see status and access zones, or to request additional permissions.");
  if (/feed|summar|catch up|what.*happen|announce/.test(s))
    return t("m.aurora.ansFeed", undefined, "The crew feed is on the Community tab. Must-reads are pinned at the top. Open it to catch up on everything since your last shift.");
  if (/time off|pto|vacation|day off/.test(s))
    return t("m.aurora.ansTimeOff", undefined, "Open Time Off to see your balance, request days, or check the status of a pending request.");
  return t("m.aurora.ansDefault", undefined, "I can point you to your schedule, reporting, access, conversions, time off and venue info. Try a suggestion below or ask me anything.");
}

function toolFor(t: Tr, q: string): string {
  const s = q.toLowerCase();
  if (/shift|schedule|work/.test(s)) return t("m.aurora.toolSchedule", undefined, "Schedule");
  if (/incident|report|injur|hazard/.test(s)) return t("m.aurora.toolTasks", undefined, "Tasks & Reports");
  if (/pass|credential|access|rose/.test(s)) return t("m.aurora.toolAccess", undefined, "Access & Rose");
  if (/time off|pto|vacation|day off/.test(s)) return t("m.aurora.toolTimeOff", undefined, "Time Off");
  if (/feed|summar|catch up|announce/.test(s)) return t("m.aurora.toolCommunity", undefined, "Community");
  if (/cater|food|meal|radio|channel/.test(s)) return t("m.aurora.toolVenue", undefined, "Venue Info");
  return t("m.aurora.toolDefault", undefined, "ATLVS");
}

type GreetKey = "hello" | "morning" | "afternoon" | "evening";

function greetingKey(): GreetKey {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

export function AuroraChat({ firstName }: { firstName: string }) {
  const t = useT();
  const [msgs, setMsgs] = React.useState<Msg[]>([]);
  const [draft, setDraft] = React.useState("");
  // Hydration-safe: init to a stable placeholder, resolve the time-of-day
  // greeting + connectivity after mount (live-time-in-render is the #418 trap).
  const [greeting, setGreeting] = React.useState<GreetKey>("hello");
  const [online, setOnline] = React.useState(true);
  const threadRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setGreeting(greetingKey());
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  React.useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  const ask = React.useCallback(
    (q: string) => {
      const text = q.trim();
      if (!text) return;
      setMsgs((m) => [...m, { me: true, txt: text }, { me: false, txt: answerFor(t, text), tool: toolFor(t, text) }]);
      setDraft("");
    },
    [t],
  );

  const promptCards: [string, string][] = [
    ["CalendarDays", t("m.aurora.promptShift", undefined, "What's my next shift?")],
    ["Megaphone", t("m.aurora.promptFeed", undefined, "Summarize the crew feed")],
    ["TriangleAlert", t("m.aurora.promptIncident", undefined, "How do I report an incident?")],
    ["CalendarOff", t("m.aurora.promptTimeOff", undefined, "How much time off do I have?")],
  ];
  const followups = [
    t("m.aurora.followWhatElse", undefined, "What else can you do?"),
    t("m.aurora.promptIncident", undefined, "How do I report an incident?"),
    t("m.aurora.followSchedule", undefined, "Where's my schedule?"),
  ];
  const greetText =
    greeting === "morning"
      ? t("m.aurora.greetMorning", undefined, "Good morning")
      : greeting === "afternoon"
        ? t("m.aurora.greetAfternoon", undefined, "Good afternoon")
        : greeting === "evening"
          ? t("m.aurora.greetEvening", undefined, "Good evening")
          : t("m.aurora.greetHello", undefined, "Hello");

  return (
    <div className="aurora-screen" ref={threadRef}>
      <div className="aurora-head">
        <span className="cop-spark">
          <KIcon name="Sparkles" size={16} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="aurora-head-t">{t("m.aurora.title", undefined, "Aurora AI")}</h1>
          <div className="aurora-head-s">
            {t("m.aurora.fieldIntelligence", undefined, "Field intelligence")} ·{" "}
            {online ? t("m.aurora.online", undefined, "online") : t("m.aurora.offline", undefined, "offline")}
          </div>
        </div>
        {msgs.length > 0 && (
          <button
            type="button"
            className="modal-x"
            onClick={() => setMsgs([])}
            aria-label={t("m.aurora.newChat", undefined, "New chat")}
            title={t("m.aurora.newChat", undefined, "New chat")}
          >
            <KIcon name="PenSquare" size={16} />
          </button>
        )}
      </div>

      {msgs.length === 0 ? (
        <div className="aurora-hello">
          <span className="aurora-orb">
            <KIcon name="Sparkles" size={26} />
          </span>
          <div className="aurora-hi">
            {greetText}, {firstName}
          </div>
          <div className="aurora-sub">
            {t("m.aurora.hint", undefined, "Ask about your shifts, crew, access or the venue and I'll point you to the right screen.")}
          </div>
          <div className="aurora-cards">
            {promptCards.map(([ic, p]) => (
              <button type="button" className="aurora-card" key={p} onClick={() => ask(p)}>
                <KIcon name={ic} size={16} />
                <span>{p}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="aurora-thread">
          {msgs.map((m, i) =>
            m.me ? (
              <div className="au-user" key={i}>
                <div className="au-user-b">{m.txt}</div>
              </div>
            ) : (
              <div className="au-ai" key={i}>
                <span className="au-ava">
                  <KIcon name="Sparkles" size={13} />
                </span>
                <div className="au-ai-body">
                  {m.tool && (
                    /* kit-ai.css adoption (W5, F-28): the "See <surface>"
                       tool-trace is the kit citation chip — provenance for the
                       answer. Non-interactive here (the deterministic guide
                       points, it doesn't navigate), hence the cursor reset;
                       the kit's margin-top is zeroed because the chip leads
                       the answer instead of trailing it. */
                    <div className="ai-cites" style={{ margin: "0 0 8px" }}>
                      <span className="ai-cite" style={{ cursor: "default" }}>
                        <KIcon name="Compass" size={11} /> {t("m.aurora.see", undefined, "See")} <b>{m.tool}</b>
                      </span>
                    </div>
                  )}
                  <div className="au-text">{m.txt}</div>
                  {i === msgs.length - 1 && (
                    <div className="au-follow">
                      {followups.map((f) => (
                        <button type="button" key={f} onClick={() => ask(f)}>
                          {f}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ),
          )}
        </div>
      )}

      <div className="aurora-composer">
        <form
          className="aurora-inputwrap"
          onSubmit={(e) => {
            e.preventDefault();
            ask(draft);
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t("m.aurora.placeholder", undefined, "Ask Aurora anything…")}
            aria-label={t("m.aurora.ask", undefined, "Ask Aurora anything")}
            enterKeyHint="send"
          />
          <button type="submit" className="au-send" aria-label={t("m.aurora.send", undefined, "Send")} disabled={!draft.trim()}>
            <KIcon name="ArrowUp" size={16} />
          </button>
        </form>
        <div className="au-foot">
          <KIcon name="ShieldCheck" size={11} />{" "}
          {t("m.aurora.previewNote", undefined, "Preview · Aurora guides you to the right screen. Live agent coming soon")}
        </div>
      </div>
    </div>
  );
}
