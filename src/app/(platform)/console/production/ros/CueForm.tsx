"use client";

import * as React from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { createCueAction, setCueStatus, deleteCue, type State } from "./actions";
import type { Cue } from "@/lib/supabase/types";

export function CueForm() {
  const [state, action, pending] = useActionState<State, FormData>(createCueAction, null);
  return (
    <form action={action} className="grid gap-3 md:grid-cols-2">
      <Input label="Scheduled at" name="scheduled_at" type="datetime-local" required />
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">Lane</label>
        <select name="lane" defaultValue="show" className="input-base mt-1.5 w-full">
          <option value="show">Show</option>
          <option value="lights">Lights</option>
          <option value="audio">Audio</option>
          <option value="video">Video</option>
          <option value="talent">Talent</option>
          <option value="safety">Safety</option>
          <option value="transport">Transport</option>
        </select>
      </div>
      <Input label="Label" name="label" required maxLength={200} placeholder="e.g. House lights down" />
      <Input
        label="Duration (sec)"
        name="duration_seconds"
        type="number"
        min={0}
        max={86400}
        placeholder="optional"
      />
      <div className="md:col-span-2">
        <label className="text-xs font-medium text-[var(--text-secondary)]">Description</label>
        <textarea name="description" rows={2} maxLength={2000} className="input-base mt-1.5 w-full" />
      </div>
      {state?.error && (
        <p className="md:col-span-2 text-xs text-[var(--color-error)]">{state.error}</p>
      )}
      <div className="md:col-span-2 flex justify-end">
        <Button type="submit" loading={pending}>Add cue</Button>
      </div>
    </form>
  );
}

const NEXT_STATUS: Record<Cue["status"], { to: Cue["status"]; label: string }[]> = {
  pending: [
    { to: "standby", label: "Standby" },
    { to: "skipped", label: "Skip" },
  ],
  standby: [
    { to: "live", label: "GO" },
    { to: "skipped", label: "Skip" },
  ],
  live: [{ to: "done", label: "Done" }],
  done: [],
  skipped: [{ to: "pending", label: "Reopen" }],
};

export function CueRow({ cue }: { cue: Cue }) {
  const [pendingTo, setPendingTo] = React.useState<string | null>(null);
  const buttons = NEXT_STATUS[cue.status] ?? [];
  return (
    <tr>
      <td className="font-mono text-xs">
        {new Date(cue.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        {cue.duration_seconds ? ` · ${formatDuration(cue.duration_seconds)}` : ""}
      </td>
      <td>
        <Badge variant={laneVariant(cue.lane)}>{cue.lane}</Badge>
      </td>
      <td>
        <div>{cue.label}</div>
        {cue.description && (
          <div className="text-xs text-[var(--text-muted)]">{cue.description}</div>
        )}
      </td>
      <td>
        <Badge variant={statusVariant(cue.status)}>{cue.status}</Badge>
      </td>
      <td className="text-end">
        <div className="inline-flex items-center gap-1">
          {buttons.map((b) => (
            <form key={b.to} action={setCueStatus} className="inline">
              <input type="hidden" name="id" value={cue.id} />
              <input type="hidden" name="status" value={b.to} />
              <button
                type="submit"
                disabled={pendingTo !== null}
                onClick={() => setPendingTo(b.to)}
                className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  b.to === "live"
                    ? "bg-emerald-500 text-white hover:bg-emerald-600"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-inset)] hover:text-[var(--text-primary)]"
                }`}
              >
                {pendingTo === b.to ? "…" : b.label}
              </button>
            </form>
          ))}
          <form action={deleteCue} className="inline">
            <input type="hidden" name="id" value={cue.id} />
            <button
              type="submit"
              className="rounded px-2 py-0.5 text-[11px] text-[color:var(--color-error)] hover:bg-[color:var(--color-error)]/10"
            >
              Delete
            </button>
          </form>
        </div>
      </td>
    </tr>
  );
}

function formatDuration(s: number): string {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem ? `${m}m ${rem}s` : `${m}m`;
}

function laneVariant(lane: Cue["lane"]): "brand" | "info" | "warning" | "muted" | "success" {
  if (lane === "lights" || lane === "video") return "warning";
  if (lane === "audio") return "info";
  if (lane === "safety") return "success";
  if (lane === "show") return "brand";
  return "muted";
}

function statusVariant(s: Cue["status"]): "muted" | "info" | "success" | "warning" | "error" {
  if (s === "live") return "warning";
  if (s === "done") return "success";
  if (s === "standby") return "info";
  if (s === "skipped") return "error";
  return "muted";
}
