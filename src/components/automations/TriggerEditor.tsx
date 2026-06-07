"use client";

import { useId } from "react";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";

export type TriggerKind = "manual" | "schedule" | "webhook" | "event";

export type TriggerEditorProps = {
  kind: TriggerKind;
  config: Record<string, unknown>;
  /** Webhook URL to display (Phase 4.3 endpoint). */
  webhookUrl?: string;
  onKindChange: (next: TriggerKind) => void;
  onConfigChange: (next: Record<string, unknown>) => void;
};

const KIND_LABELS: Record<TriggerKind, string> = {
  manual: "Manual",
  schedule: "Schedule",
  webhook: "Webhook",
  event: "Record Event",
};

const KIND_DESCRIPTIONS: Record<TriggerKind, string> = {
  manual: "Triggered by a user clicking Run now on this page.",
  schedule: "Runs on a recurring cron / RRULE schedule. Backend lands in Phase 4.3.",
  webhook: "Runs when an inbound HTTP POST hits the URL below. Backend lands in Phase 4.3.",
  event: "Runs when a record event matches (created / updated). Backend lands in Phase 4.5.",
};

const EVENT_TABLES = ["tickets", "tasks", "deliverables", "incidents", "punch_items", "rfis", "submittals"];

export function TriggerEditor({ kind, config, webhookUrl, onKindChange, onConfigChange }: TriggerEditorProps) {
  const kindId = useId();
  return (
    <div className="surface flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <Badge variant="info">Trigger</Badge>
        <span className="text-sm font-semibold text-[var(--p-text-1)]">{KIND_LABELS[kind]}</span>
      </div>
      <p className="text-[11px] text-[var(--p-text-2)]">{KIND_DESCRIPTIONS[kind]}</p>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={kindId} className="text-xs font-medium text-[var(--p-text-2)]">
          Kind
        </label>
        <Select value={kind} onValueChange={(v) => onKindChange(v as TriggerKind)}>
          <SelectTrigger id={kindId} aria-label="Trigger kind">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(KIND_LABELS) as TriggerKind[]).map((k) => (
              <SelectItem key={k} value={k}>
                {KIND_LABELS[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {kind === "manual" && (
        <p className="text-[11px] text-[var(--p-text-2)]">
          No additional configuration. Use the &quot;Run now&quot; button under Controls to trigger a run.
        </p>
      )}

      {kind === "schedule" && <ScheduleConfig config={config} onChange={onConfigChange} />}

      {kind === "webhook" && <WebhookConfig config={config} url={webhookUrl} onChange={onConfigChange} />}

      {kind === "event" && <EventConfig config={config} onChange={onConfigChange} />}
    </div>
  );
}

function ScheduleConfig({
  config,
  onChange,
}: {
  config: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  const rrule = typeof config.rrule === "string" ? config.rrule : "";
  return (
    <div className="grid gap-2 rounded-md border border-dashed border-[var(--p-border)] bg-[var(--p-surface-2)] p-3">
      <div className="flex items-center gap-2">
        <Badge variant="warning">Coming soon</Badge>
        <span className="text-[11px] text-[var(--p-text-2)]">Schedule trigger lands in Phase 4.3.</span>
      </div>
      <Input
        label="RRULE / cron"
        placeholder="FREQ=DAILY;BYHOUR=9;BYMINUTE=0"
        value={rrule}
        onChange={(e) => onChange({ ...config, rrule: e.target.value })}
        hint="iCal RRULE syntax. Saved now; runner enables it in P4.3."
      />
    </div>
  );
}

function WebhookConfig({
  config,
  url,
  onChange,
}: {
  config: Record<string, unknown>;
  url?: string;
  onChange: (next: Record<string, unknown>) => void;
}) {
  const secret = typeof config.secret === "string" ? config.secret : "";
  return (
    <div className="grid gap-2 rounded-md border border-dashed border-[var(--p-border)] bg-[var(--p-surface-2)] p-3">
      <div className="flex items-center gap-2">
        <Badge variant="warning">Coming soon</Badge>
        <span className="text-[11px] text-[var(--p-text-2)]">Inbound endpoint lands in Phase 4.3.</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-[var(--p-text-2)]">Inbound URL</span>
        <code className="rounded bg-[var(--p-surface)] px-2 py-1.5 font-mono text-xs text-[var(--p-text-2)] select-all">
          {url ?? "/api/v1/automations/<id>/webhook"}
        </code>
      </div>
      <Input
        label="Shared Secret — HMAC"
        placeholder="optional — falls back to per-automation secret"
        value={secret}
        onChange={(e) => onChange({ ...config, secret: e.target.value })}
        hint="If set, the runner verifies x-lyt-signature before dispatch."
      />
    </div>
  );
}

function EventConfig({
  config,
  onChange,
}: {
  config: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  const tableId = useId();
  const eventTypeId = useId();
  const table = typeof config.table === "string" ? config.table : "";
  const eventType = typeof config.eventType === "string" ? config.eventType : "";
  return (
    <div className="grid gap-2 rounded-md border border-dashed border-[var(--p-border)] bg-[var(--p-surface-2)] p-3">
      <div className="flex items-center gap-2">
        <Badge variant="warning">Coming soon</Badge>
        <span className="text-[11px] text-[var(--p-text-2)]">Event subscription lands in Phase 4.5.</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={tableId} className="text-xs font-medium text-[var(--p-text-2)]">
          Target Table
        </label>
        <Select value={table} onValueChange={(v) => onChange({ ...config, table: v })}>
          <SelectTrigger id={tableId} aria-label="Target table">
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {EVENT_TABLES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={eventTypeId} className="text-xs font-medium text-[var(--p-text-2)]">
          Event Type
        </label>
        <Select value={eventType} onValueChange={(v) => onChange({ ...config, eventType: v })}>
          <SelectTrigger id={eventTypeId} aria-label="Event type">
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created">Record created</SelectItem>
            <SelectItem value="updated">Record updated</SelectItem>
            <SelectItem value="deleted">Record deleted</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
