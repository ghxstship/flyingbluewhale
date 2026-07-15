"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KIcon } from "@/components/mobile/kit";
import { submitDailyLog } from "./actions";

/**
 * Submit a draft log for review, from the field.
 *
 * COMPVSS could author a site diary and never finish it: the save action
 * hard-codes `draft` and no transition path existed in the mobile shell, so
 * the person who was actually on site had to find a desktop to push their
 * own log forward. Only drafts render this — `submitted` and `approved` are
 * not the field's to move (approval is the console's, per the FSM).
 */
export function SubmitLogButton({ id, label }: { id: string; label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (pending) return;
    setError(null);
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      const res = await submitDailyLog(null, fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <>
      <button
        type="button"
        className="ps-btn ps-btn--cta"
        style={{ flex: "none" }}
        disabled={pending}
        onClick={submit}
      >
        <KIcon name="Check" size={14} /> {label}
      </button>
      {error && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginTop: 8, width: "100%" }}>
          {error}
        </div>
      )}
    </>
  );
}
