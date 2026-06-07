"use client";

import * as React from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { createCueAction, setCueStatus, deleteCue, type State } from "./actions";
import type { Cue } from "@/lib/supabase/types";
import { toTitle } from "@/lib/format";
import { useT } from "@/lib/i18n/LocaleProvider";

export function CueForm() {
  const t = useT();
  const [state, action, pending] = useActionState<State, FormData>(createCueAction, null);
  return (
    <form action={action} className="grid gap-3 md:grid-cols-2">
      <Input
        label={t("console.production.ros.cueForm.scheduledAt", undefined, "Scheduled At")}
        name="scheduled_at"
        type="datetime-local"
        required
      />
      <div>
        <label className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.production.ros.cueForm.lane", undefined, "Lane")}
        </label>
        <select name="lane" defaultValue="show" className="ps-input mt-1.5 w-full">
          <option value="show">{t("console.production.ros.cueForm.lane.show", undefined, "Show")}</option>
          <option value="lights">{t("console.production.ros.cueForm.lane.lights", undefined, "Lights")}</option>
          <option value="audio">{t("console.production.ros.cueForm.lane.audio", undefined, "Audio")}</option>
          <option value="video">{t("console.production.ros.cueForm.lane.video", undefined, "Video")}</option>
          <option value="talent">{t("console.production.ros.cueForm.lane.talent", undefined, "Talent")}</option>
          <option value="safety">{t("console.production.ros.cueForm.lane.safety", undefined, "Safety")}</option>
          <option value="transport">
            {t("console.production.ros.cueForm.lane.transport", undefined, "Transport")}
          </option>
        </select>
      </div>
      <Input
        label={t("console.production.ros.cueForm.label", undefined, "Label")}
        name="label"
        required
        maxLength={200}
        placeholder={t("console.production.ros.cueForm.labelPlaceholder", undefined, "e.g. House lights down")}
      />
      <Input
        label={t("console.production.ros.cueForm.durationSec", undefined, "Duration — Sec")}
        name="duration_seconds"
        type="number"
        min={0}
        max={86400}
        placeholder={t("console.production.ros.cueForm.optional", undefined, "optional")}
      />
      <div className="md:col-span-2">
        <label className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.production.ros.cueForm.description", undefined, "Description")}
        </label>
        <textarea name="description" rows={2} maxLength={2000} className="ps-input mt-1.5 w-full" />
      </div>
      {state?.error && <p className="text-xs text-[var(--p-danger)] md:col-span-2">{state.error}</p>}
      <div className="flex justify-end md:col-span-2">
        <Button type="submit" loading={pending}>
          {t("console.production.ros.cueForm.addCue", undefined, "Add Cue")}
        </Button>
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
  const t = useT();
  const [pendingTo, setPendingTo] = React.useState<string | null>(null);
  const buttons = NEXT_STATUS[cue.status] ?? [];
  return (
    <tr>
      <td className="font-mono text-xs">
        {new Date(cue.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        {cue.duration_seconds ? ` · ${formatDuration(cue.duration_seconds)}` : ""}
      </td>
      <td>
        <Badge variant={laneVariant(cue.lane)}>{toTitle(cue.lane)}</Badge>
      </td>
      <td>
        <div>{cue.label}</div>
        {cue.description && <div className="text-xs text-[var(--p-text-2)]">{cue.description}</div>}
      </td>
      <td>
        <Badge variant={statusVariant(cue.status)}>{toTitle(cue.status)}</Badge>
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
                    ? "bg-[var(--p-success)] text-white hover:bg-[color-mix(in_srgb,var(--p-success)_85%,black)]"
                    : "text-[var(--p-text-2)] hover:bg-[var(--p-surface-2)] hover:text-[var(--p-text-1)]"
                }`}
              >
                {pendingTo === b.to ? "…" : t(`console.production.ros.cueForm.action.${b.to}`, undefined, b.label)}
              </button>
            </form>
          ))}
          <form action={deleteCue} className="inline">
            <input type="hidden" name="id" value={cue.id} />
            <button
              type="submit"
              className="rounded px-2 py-0.5 text-[11px] text-[color:var(--p-danger)] hover:bg-[color:var(--p-danger)]/10"
            >
              {t("common.delete", undefined, "Delete")}
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
