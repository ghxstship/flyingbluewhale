"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KIcon } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";
import { acknowledgeSop } from "../actions";

/** The must-read acknowledgement CTA. Acknowledged state renders as fact. */
export function AcknowledgeButton({ sopId, acked }: { sopId: string; acked: boolean }) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (acked) {
    return (
      <div className="item" style={{ marginTop: 8 }}>
        <KIcon name="Check" size={18} style={{ color: "var(--p-success)", flex: "none" }} />
        <div className="t">{t("m.docs.ackDone", undefined, "You've Acknowledged This Article")}</div>
      </div>
    );
  }

  const ack = () => {
    if (pending) return;
    setError(null);
    const fd = new FormData();
    fd.set("sopId", sopId);
    startTransition(async () => {
      const res = await acknowledgeSop(null, fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <>
      {error && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginTop: 8 }}>
          {error}
        </div>
      )}
      <button
        type="button"
        className="ps-btn ps-btn--cta ps-btn--lg"
        style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
        disabled={pending}
        onClick={ack}
      >
        <KIcon name="Check" size={15} />{" "}
        {pending
          ? t("m.docs.acking", undefined, "Recording…")
          : t("m.docs.ackCta", undefined, "I've Read & Understood This")}
      </button>
    </>
  );
}
