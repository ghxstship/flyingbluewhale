"use client";

import * as React from "react";
import { KIcon } from "@/components/mobile/kit";

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

const PROMPT_CARDS: [string, string][] = [
  ["CalendarDays", "What's my next shift?"],
  ["Megaphone", "Summarize the crew feed"],
  ["TriangleAlert", "How do I report an incident?"],
  ["CalendarOff", "How much time off do I have?"],
];
const FOLLOWUPS = ["What else can you do?", "How do I report an incident?", "Where's my schedule?"];

function answerFor(q: string): string {
  const t = q.toLowerCase();
  if (/next shift|when.*work|schedule/.test(t))
    return "Your shifts live on the Schedule tab — open it to see your next call, its location and times. Tap a shift for the full brief.";
  if (/incident|report|injur|hazard/.test(t))
    return "To file an incident: open Tasks then Report It (also under Quick Actions on Home). Pick a type, set severity, add a photo, and it routes to Ops.";
  if (/convert|ft|feet|meter|metre|lb|kg/.test(t))
    return "The Unit Converter is in your Toolbox — it handles length, weight and temperature for quick on-site math.";
  if (/cater|food|meal|eat/.test(t))
    return "Meal service times and your meal voucher are on your Rose and in the venue guide — check Access & Rose for the voucher.";
  if (/radio|channel/.test(t))
    return "Radio channel assignments are in the Toolbox under Radio Channels, and on the shift brief for the zone you're working.";
  if (/pass|credential|access|rose/.test(t))
    return "Your Rose (credential) is on the Home tab — open it to see status and access zones, or to request additional permissions.";
  if (/feed|summar|catch up|what.*happen|announce/.test(t))
    return "The crew feed is on the Community tab — must-reads are pinned at the top. Open it to catch up on everything since your last shift.";
  if (/time off|pto|vacation|day off/.test(t))
    return "Open Time Off to see your balance, request days, or check the status of a pending request.";
  return "I can point you to your schedule, reporting, access, conversions, time off and venue info. Try a suggestion below or ask me anything.";
}

function toolFor(q: string): string {
  const t = q.toLowerCase();
  if (/shift|schedule|work/.test(t)) return "Schedule";
  if (/incident|report|injur|hazard/.test(t)) return "Tasks & Reports";
  if (/pass|credential|access|rose/.test(t)) return "Access & Rose";
  if (/time off|pto|vacation|day off/.test(t)) return "Time Off";
  if (/feed|summar|catch up|announce/.test(t)) return "Community";
  if (/cater|food|meal|radio|channel/.test(t)) return "Venue Info";
  return "ATLVS";
}

function greetingWord(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function AuroraChat({ firstName }: { firstName: string }) {
  const [msgs, setMsgs] = React.useState<Msg[]>([]);
  const [draft, setDraft] = React.useState("");
  // Hydration-safe: init to a stable placeholder, resolve the time-of-day
  // greeting + connectivity after mount (live-time-in-render is the #418 trap).
  const [greeting, setGreeting] = React.useState("Hello");
  const [online, setOnline] = React.useState(true);
  const threadRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setGreeting(greetingWord());
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

  const ask = React.useCallback((q: string) => {
    const text = q.trim();
    if (!text) return;
    setMsgs((m) => [...m, { me: true, txt: text }, { me: false, txt: answerFor(text), tool: toolFor(text) }]);
    setDraft("");
  }, []);

  return (
    <div className="aurora-screen" ref={threadRef}>
      <div className="aurora-head">
        <span className="cop-spark">
          <KIcon name="Sparkles" size={16} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="aurora-head-t">Aurora AI</h1>
          <div className="aurora-head-s">Field intelligence · {online ? "online" : "offline"}</div>
        </div>
        {msgs.length > 0 && (
          <button
            type="button"
            className="modal-x"
            onClick={() => setMsgs([])}
            aria-label="New chat"
            title="New chat"
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
            {greeting}, {firstName}
          </div>
          <div className="aurora-sub">
            Ask about your shifts, crew, access or the venue and I&apos;ll point you to the right screen.
          </div>
          <div className="aurora-cards">
            {PROMPT_CARDS.map(([ic, p]) => (
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
                    <div className="au-tool">
                      <KIcon name="Compass" size={11} /> See <b>{m.tool}</b>
                    </div>
                  )}
                  <div className="au-text">{m.txt}</div>
                  {i === msgs.length - 1 && (
                    <div className="au-follow">
                      {FOLLOWUPS.map((f) => (
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
          <button type="button" className="au-tool-btn" aria-label="Attach">
            <KIcon name="Plus" size={17} />
          </button>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask Aurora anything…"
            aria-label="Ask Aurora anything"
            enterKeyHint="send"
          />
          <button type="submit" className="au-send" aria-label="Send" disabled={!draft.trim()}>
            <KIcon name="ArrowUp" size={16} />
          </button>
        </form>
        <div className="au-foot">
          <KIcon name="ShieldCheck" size={11} /> Preview · Aurora guides you to the right screen — live agent
          coming soon
        </div>
      </div>
    </div>
  );
}
