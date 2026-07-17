"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPacket, type State } from "./actions";

/** Kit 30 · seeds the 4-doc packet onto a letter that predates the assign flow. */
export function CreatePacketButton({ engagementId, label }: { engagementId: string; label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<State>(null);

  return (
    <div>
      {state?.error && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 12 }}>
          {state.error}
        </div>
      )}
      <button
        type="button"
        className="ps-btn ps-btn--cta"
        disabled={pending}
        style={{ opacity: pending ? 0.6 : 1 }}
        onClick={() => {
          if (pending) return;
          setState(null);
          startTransition(async () => {
            const res = await createPacket(engagementId, null, new FormData());
            if (res?.error) {
              setState(res);
              return;
            }
            router.refresh();
          });
        }}
      >
        {label}
      </button>
    </div>
  );
}
