"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useRouter } from "next/navigation";

export function AvailabilityResponseForm({ requestId }: { requestId: string }) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function respond(status: "available" | "unavailable") {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/v1/crew-availability-requests/${requestId}/respond`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status, response_note: note || undefined }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error?.message ?? "Failed to submit");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="surface rounded-xl space-y-4 p-5">
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">Note (optional)</label>
        <textarea
          className="input-base mt-1.5 w-full"
          rows={3}
          placeholder="Any notes for the organizer…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
        />
      </div>
      {error && <Alert kind="error">{error}</Alert>}
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="secondary"
          className="w-full border-red-300 text-red-600 hover:bg-red-50"
          onClick={() => respond("unavailable")}
          disabled={pending}
        >
          {pending ? "…" : "Unavailable"}
        </Button>
        <Button
          type="button"
          className="w-full"
          onClick={() => respond("available")}
          disabled={pending}
        >
          {pending ? "…" : "Available ✓"}
        </Button>
      </div>
    </div>
  );
}
