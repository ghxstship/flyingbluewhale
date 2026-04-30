"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Action = "check_in" | "check_out" | "break_start" | "break_end";

export function CheckInControls({
  shiftId,
  attendance,
}: {
  shiftId: string;
  attendance: "scheduled" | "checked_in" | "on_break" | "checked_out" | "no_show";
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  const submit = (action: Action, label: string) => {
    start(async () => {
      try {
        const res = await fetch("/api/v1/shifts/checkin", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ shiftId, action }),
        });
        const json = (await res.json()) as { ok: boolean; error?: { message: string } };
        if (!json.ok) {
          toast.error(json.error?.message ?? "Couldn't update");
          return;
        }
        toast.success(label);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Network error");
      }
    });
  };

  // Render the relevant action(s) for the current state.
  if (attendance === "checked_out") {
    return <div className="text-xs text-[var(--text-muted)]">Shift closed.</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {attendance === "scheduled" && (
        <button
          type="button"
          className="btn btn-primary col-span-2"
          disabled={pending}
          onClick={() => submit("check_in", "Checked in")}
        >
          {pending ? "Working…" : "Clock in"}
        </button>
      )}
      {attendance === "checked_in" && (
        <>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={pending}
            onClick={() => submit("break_start", "Break started")}
          >
            Start break
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={pending}
            onClick={() => submit("check_out", "Clocked out")}
          >
            Clock out
          </button>
        </>
      )}
      {attendance === "on_break" && (
        <>
          <button
            type="button"
            className="btn btn-primary"
            disabled={pending}
            onClick={() => submit("break_end", "Back from break")}
          >
            End break
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={pending}
            onClick={() => submit("check_out", "Clocked out")}
          >
            Clock out
          </button>
        </>
      )}
    </div>
  );
}
