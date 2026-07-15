"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KIcon } from "@/components/mobile/kit";
import { PLATFORM_ROLES } from "@/lib/supabase/types";
import { updatePerson } from "@/app/(platform)/studio/people/[personId]/edit/actions";

export type MemberRow = {
  userId: string;
  name: string;
  email: string;
  role: string;
  updatedAt: string;
  isSelf: boolean;
};

const ROLE_TONE: Record<string, string> = {
  owner: "accent",
  admin: "info",
  manager: "warn",
  member: "neutral",
};

/**
 * Change a member's role, from the field.
 *
 * Calls the CONSOLE's `updatePerson` directly rather than carrying a
 * mobile copy. That action already refuses a self-edit, refuses to demote
 * the last owner, uses optimistic concurrency against `updated_at`, and
 * emits an explicit audit row — every one of those is load-bearing, and a
 * second implementation would eventually drift from it. This whole audit
 * has been a catalogue of exactly that drift, so: one action, two callers.
 *
 * The concurrency check is why `updatedAt` is threaded through the row
 * rather than looked up at submit: a phone screen left open on a bus is
 * the most likely stale write in the product, and the action must be able
 * to refuse it.
 */
export function TeamAdmin({
  members,
  ownerCount,
  labels,
}: {
  members: MemberRow[];
  ownerCount: number;
  labels: {
    you: string;
    change: string;
    cancel: string;
    save: string;
    selfNote: string;
    lastOwner: string;
  };
}) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [role, setRole] = useState<string>("member");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = (m: MemberRow) => {
    if (pending) return;
    setError(null);
    const fd = new FormData();
    fd.set("role", role);
    // The action reads is_developer from the form; omitting it would clear
    // the flag on every save. Preserve by not offering it here — the field
    // has no business granting developer access, so we never send `on`.
    fd.set("is_developer", "false");
    fd.set("_updated_at", m.updatedAt);
    startTransition(async () => {
      const res = await updatePerson(m.userId, null, fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setOpenId(null);
      router.refresh();
    });
  };

  return (
    <>
      {error && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 10 }}>
          {error}
        </div>
      )}

      {members.map((m) => {
        const isOnlyOwner = m.role === "owner" && ownerCount <= 1;
        const locked = m.isSelf || isOnlyOwner;
        return (
          <div className="item" key={m.userId} style={{ display: "block" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="t">
                  {m.name}
                  {m.isSelf && <span className="s"> · {labels.you}</span>}
                </div>
                <div className="s">{m.email}</div>
              </div>
              <span className={`ps-badge ps-badge--${ROLE_TONE[m.role] ?? "neutral"}`}>{m.role}</span>
            </div>

            {/* Why a row can't be changed is more useful than the row
                simply not responding. */}
            {locked ? (
              <div className="hint" style={{ marginTop: 6 }}>
                {m.isSelf ? labels.selfNote : labels.lastOwner}
              </div>
            ) : openId === m.userId ? (
              <div style={{ marginTop: 8 }}>
                <div className="fld">
                  <label htmlFor={`role-${m.userId}`}>{labels.change}</label>
                  <select id={`role-${m.userId}`} value={role} onChange={(e) => setRole(e.target.value)}>
                    {PLATFORM_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className="ps-btn ps-btn--secondary"
                    style={{ flex: 1, justifyContent: "center" }}
                    onClick={() => setOpenId(null)}
                  >
                    {labels.cancel}
                  </button>
                  <button
                    type="button"
                    className="ps-btn ps-btn--cta"
                    style={{ flex: 1, justifyContent: "center" }}
                    disabled={pending}
                    onClick={() => save(m)}
                  >
                    <KIcon name="Check" size={14} /> {labels.save}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="ps-btn ps-btn--tertiary"
                style={{ marginTop: 8, width: "100%", justifyContent: "center" }}
                onClick={() => {
                  setRole(m.role);
                  setOpenId(m.userId);
                  setError(null);
                }}
              >
                <KIcon name="UserCog" size={14} /> {labels.change}
              </button>
            )}
          </div>
        );
      })}
    </>
  );
}
