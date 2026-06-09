"use client";

import { useId } from "react";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { useT } from "@/lib/i18n/LocaleProvider";

type Translator = (key: string, vars?: Record<string, string | number>, fallback?: string) => string;

export type TriggerKind = "manual" | "schedule" | "webhook" | "event";

export type TriggerEditorProps = {
  kind: TriggerKind;
  config: Record<string, unknown>;
  /** Webhook URL to display (Phase 4.3 endpoint). */
  webhookUrl?: string;
  onKindChange: (next: TriggerKind) => void;
  onConfigChange: (next: Record<string, unknown>) => void;
};

function kindLabels(t: Translator): Record<TriggerKind, string> {
  return {
    manual: t("components.triggerEditor.kind.manual", undefined, "Manual"),
    schedule: t("components.triggerEditor.kind.schedule", undefined, "Schedule"),
    webhook: t("components.triggerEditor.kind.webhook", undefined, "Webhook"),
    event: t("components.triggerEditor.kind.event", undefined, "Record Event"),
  };
}

function kindDescriptions(t: Translator): Record<TriggerKind, string> {
  return {
    manual: t("components.triggerEditor.desc.manual", undefined, "Triggered by a user clicking Run now on this page."),
    schedule: t("components.triggerEditor.desc.schedule", undefined, "Runs on a recurring cron / RRULE schedule."),
    webhook: t(
      "components.triggerEditor.desc.webhook",
      undefined,
      "Runs when an inbound HTTP POST hits the URL below.",
    ),
    event: t(
      "components.triggerEditor.desc.event",
      undefined,
      "Runs when a record event matches — created or updated.",
    ),
  };
}

const EVENT_TABLES = ["tickets", "tasks", "deliverables", "incidents", "punch_items", "rfis", "submittals"];

export function TriggerEditor({ kind, config, webhookUrl, onKindChange, onConfigChange }: TriggerEditorProps) {
  const t = useT();
  const kindId = useId();
  const KIND_LABELS = kindLabels(t);
  const KIND_DESCRIPTIONS = kindDescriptions(t);
  return (
    <div className="surface flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <Badge variant="info">Trigger</Badge>
        <span className="text-sm font-semibold text-[var(--p-text-1)]">{KIND_LABELS[kind]}</span>
      </div>
      <p className="text-[11px] text-[var(--p-text-2)]">{KIND_DESCRIPTIONS[kind]}</p>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={kindId} className="text-xs font-medium text-[var(--p-text-2)]">
          {t("components.triggerEditor.kindLabel", undefined, "Kind")}
        </label>
        <Select value={kind} onValueChange={(v) => onKindChange(v as TriggerKind)}>
          <SelectTrigger id={kindId} aria-label={t("components.triggerEditor.kindAria", undefined, "Trigger kind")}>
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
          {t(
            "components.triggerEditor.manualNote",
            undefined,
            "No additional configuration. Use the Run now button under Controls to trigger a run.",
          )}
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
  const t = useT();
  const rrule = typeof config.rrule === "string" ? config.rrule : "";
  return (
    <div className="grid gap-2 rounded-md border border-dashed border-[var(--p-border)] bg-[var(--p-surface-2)] p-3">
      <Input
        label={t("components.triggerEditor.rruleLabel", undefined, "RRULE / Cron")}
        placeholder="FREQ=DAILY;BYHOUR=9;BYMINUTE=0"
        value={rrule}
        onChange={(e) => onChange({ ...config, rrule: e.target.value })}
        hint={t(
          "components.triggerEditor.rruleHint",
          undefined,
          "iCal RRULE syntax. The schedule runner picks it up on the next evaluation pass.",
        )}
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
  const t = useT();
  const secret = typeof config.secret === "string" ? config.secret : "";
  return (
    <div className="grid gap-2 rounded-md border border-dashed border-[var(--p-border)] bg-[var(--p-surface-2)] p-3">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-[var(--p-text-2)]">
          {t("components.triggerEditor.inboundUrl", undefined, "Inbound URL")}
        </span>
        <code className="rounded bg-[var(--p-surface)] px-2 py-1.5 font-mono text-xs text-[var(--p-text-2)] select-all">
          {url ?? "/api/v1/automations/<id>/webhook"}
        </code>
      </div>
      <Input
        label={t("components.triggerEditor.secretLabel", undefined, "Shared Secret — HMAC")}
        placeholder={t(
          "components.triggerEditor.secretPlaceholder",
          undefined,
          "Optional — falls back to per-automation secret",
        )}
        value={secret}
        onChange={(e) => onChange({ ...config, secret: e.target.value })}
        hint={t(
          "components.triggerEditor.secretHint",
          undefined,
          "If set, the runner verifies x-lyt-signature before dispatch.",
        )}
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
  const t = useT();
  const tableId = useId();
  const eventTypeId = useId();
  const table = typeof config.table === "string" ? config.table : "";
  const eventType = typeof config.eventType === "string" ? config.eventType : "";
  return (
    <div className="grid gap-2 rounded-md border border-dashed border-[var(--p-border)] bg-[var(--p-surface-2)] p-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={tableId} className="text-xs font-medium text-[var(--p-text-2)]">
          {t("components.triggerEditor.targetTable", undefined, "Target Table")}
        </label>
        <Select value={table} onValueChange={(v) => onChange({ ...config, table: v })}>
          <SelectTrigger
            id={tableId}
            aria-label={t("components.triggerEditor.targetTableAria", undefined, "Target table")}
          >
            <SelectValue placeholder={t("components.triggerEditor.selectPlaceholder", undefined, "Select…")} />
          </SelectTrigger>
          <SelectContent>
            {EVENT_TABLES.map((tbl) => (
              <SelectItem key={tbl} value={tbl}>
                {tbl}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={eventTypeId} className="text-xs font-medium text-[var(--p-text-2)]">
          {t("components.triggerEditor.eventType", undefined, "Event Type")}
        </label>
        <Select value={eventType} onValueChange={(v) => onChange({ ...config, eventType: v })}>
          <SelectTrigger
            id={eventTypeId}
            aria-label={t("components.triggerEditor.eventTypeAria", undefined, "Event type")}
          >
            <SelectValue placeholder={t("components.triggerEditor.selectPlaceholder", undefined, "Select…")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created">
              {t("components.triggerEditor.recordCreated", undefined, "Record created")}
            </SelectItem>
            <SelectItem value="updated">
              {t("components.triggerEditor.recordUpdated", undefined, "Record updated")}
            </SelectItem>
            <SelectItem value="deleted">
              {t("components.triggerEditor.recordDeleted", undefined, "Record deleted")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
