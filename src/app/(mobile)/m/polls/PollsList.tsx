"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KIcon } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";
import { votePoll } from "./actions";

/**
 * PollsList — client leaf for inline poll voting. Live + unvoted polls show
 * their options as tap-to-vote buttons; voted or closed polls show result
 * bars with the caller's own pick marked. The server page shapes all counts;
 * this component only fires `votePoll` and refreshes.
 */

export type PollView = {
  id: string;
  question: string;
  closed: boolean;
  myOptionId: string | null;
  total: number;
  closesLabel: string | null;
  options: { id: string; label: string; count: number; pct: number }[];
};

export function PollsList({ polls }: { polls: PollView[] }) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [votingOption, setVotingOption] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function castVote(pollId: string, optionId: string) {
    if (pending) return;
    setVotingOption(optionId);
    startTransition(async () => {
      const res = await votePoll(pollId, optionId);
      setVotingOption(null);
      if (res?.error) {
        setErrors((prev) => ({ ...prev, [pollId]: res.error! }));
        return;
      }
      setErrors((prev) => {
        const next = { ...prev };
        delete next[pollId];
        return next;
      });
      router.refresh();
    });
  }

  return (
    <>
      {polls.map((p) => {
        const showResults = p.closed || p.myOptionId != null;
        return (
          <section
            key={p.id}
            className="surface"
            style={{ padding: 14, borderRadius: "var(--p-r-md)", marginBottom: 12 }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
              <div className="t" style={{ flex: 1, minWidth: 0 }}>
                {p.question}
              </div>
              {p.closed ? (
                <span className="ps-badge ps-badge--neutral" style={{ flex: "none" }}>
                  {t("m.polls.state.closed", undefined, "Closed")}
                </span>
              ) : p.myOptionId ? (
                <span className="ps-badge ps-badge--ok" style={{ flex: "none" }}>
                  {t("m.polls.state.voted", undefined, "Voted")}
                </span>
              ) : (
                <span className="ps-badge ps-badge--info" style={{ flex: "none" }}>
                  {t("m.polls.state.live", undefined, "Live")}
                </span>
              )}
            </div>

            {errors[p.id] && (
              <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 10 }}>
                {errors[p.id]}
              </div>
            )}

            {showResults ? (
              <div>
                {p.options.map((o) => {
                  const mine = o.id === p.myOptionId;
                  return (
                    <div key={o.id} style={{ marginBottom: 10 }}>
                      <div
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}
                      >
                        <span style={{ fontWeight: mine ? 700 : 500, display: "inline-flex", alignItems: "center", gap: 5 }}>
                          {mine && <KIcon name="Check" size={14} />}
                          {o.label}
                          {mine && (
                            <span className="s" style={{ fontWeight: 500 }}>
                              {t("m.polls.yourVote", undefined, "Your vote")}
                            </span>
                          )}
                        </span>
                        <span className="s" style={{ fontVariantNumeric: "tabular-nums" }}>
                          {t("m.polls.tally", { count: o.count, pct: o.pct }, `${o.count} (${o.pct}%)`)}
                        </span>
                      </div>
                      <div
                        style={{
                          marginTop: 4,
                          height: 8,
                          borderRadius: 999,
                          overflow: "hidden",
                          background: "var(--p-surface-2)",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            borderRadius: 999,
                            width: `${o.pct}%`,
                            background: mine ? "var(--p-accent)" : "var(--p-border)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="s" style={{ color: "var(--p-text-3)" }}>
                  {t("m.polls.totalVotes", { count: p.total }, `${p.total} votes`)}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {p.options.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    className="ps-btn ps-btn--tertiary"
                    style={{ justifyContent: "center", width: "100%" }}
                    disabled={pending}
                    onClick={() => castVote(p.id, o.id)}
                  >
                    {pending && votingOption === o.id
                      ? t("m.polls.voting", undefined, "Voting…")
                      : o.label}
                  </button>
                ))}
                {p.closesLabel && (
                  <div className="s" style={{ color: "var(--p-text-3)" }}>
                    {p.closesLabel}
                  </div>
                )}
              </div>
            )}
          </section>
        );
      })}
    </>
  );
}
