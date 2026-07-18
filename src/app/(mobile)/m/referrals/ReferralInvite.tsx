"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, UserPlus } from "lucide-react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { sendReferralInvite } from "./actions";

/**
 * Inline referral invite composer. Opens on the "Invite" CTA, posts the
 * contact to `sendReferralInvite`, and refreshes the list on success.
 */
export function ReferralInvite({ shareLabel, autoOpen = false }: { shareLabel: string; autoOpen?: boolean }) {
  const t = useT();
  const router = useRouter();
  // Kit 32 A4 — Job Share deep-links here (?job=…), so the composer opens ready.
  const [open, setOpen] = useState(autoOpen);
  const [contact, setContact] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTx] = useTransition();

  const submit = () => {
    if (pending) return;
    setError(null);
    const fd = new FormData();
    fd.set("contact", contact);
    startTx(async () => {
      const res = await sendReferralInvite(null, fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setContact("");
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <div style={{ display: "flex", gap: 10, margin: "2px 0 6px" }}>
        <button type="button" className="ps-btn ps-btn--cta" style={{ flex: 1, justifyContent: "center" }}>
          <Send size={16} /> {shareLabel}
        </button>
        <button
          type="button"
          className="ps-btn ps-btn--secondary"
          style={{ flex: 1, justifyContent: "center" }}
          onClick={() => setOpen((o) => !o)}
        >
          <UserPlus size={16} /> {t("m.referrals.invite", undefined, "Invite")}
        </button>
      </div>

      {open && (
        <div className="item" style={{ display: "block" }}>
          {error && (
            <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 8 }}>
              {error}
            </div>
          )}
          <label className="wl" htmlFor="ref-contact" style={{ display: "block", marginBottom: 6 }}>
            {t("m.referrals.contactLabel", undefined, "Email Or Phone")}
          </label>
          <input
            id="ref-contact"
            className="ps-input"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder={t("m.referrals.contactPlaceholder", undefined, "name@example.com")}
            style={{ width: "100%", marginBottom: 10 }}
          />
          <button
            type="button"
            className="ps-btn ps-btn--cta"
            style={{ width: "100%", justifyContent: "center" }}
            disabled={pending || !contact.trim()}
            onClick={submit}
          >
            {pending
              ? t("m.referrals.sending", undefined, "Sending…")
              : t("m.referrals.send", undefined, "Send Invite")}
          </button>
        </div>
      )}
    </>
  );
}
