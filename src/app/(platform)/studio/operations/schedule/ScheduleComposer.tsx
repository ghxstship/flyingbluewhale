"use client";

import * as React from "react";
import { useActionState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createActivity, type State } from "./actions";

type Option = { id: string; label: string };

const ACTIVITY_KINDS: Array<{ value: string; label: string }> = [
  { value: "general", label: "General" },
  { value: "rehearsal", label: "Rehearsal" },
  { value: "sound_check", label: "Sound Check" },
  { value: "changeover", label: "Changeover" },
  { value: "load_in", label: "Load In" },
  { value: "load_out", label: "Load Out" },
  { value: "delivery", label: "Delivery" },
  { value: "inspection", label: "Inspection" },
  { value: "shift", label: "Shift" },
  { value: "meeting", label: "Meeting" },
  { value: "training", label: "Training" },
  { value: "run_of_show", label: "Run Of Show" },
  { value: "doors", label: "Doors" },
  { value: "set", label: "Set" },
  { value: "curfew", label: "Curfew" },
];

const LOCATION_KINDS: Array<{ value: string; label: string }> = [
  { value: "venue", label: "Venue" },
  { value: "vessel", label: "Vessel" },
  { value: "hotel_block", label: "Hotel Block" },
  { value: "warehouse", label: "Warehouse" },
  { value: "office", label: "Office" },
  { value: "greenroom", label: "Greenroom" },
  { value: "vehicle", label: "Vehicle" },
];

export function ScheduleComposer({
  venues,
  crew,
  projects,
  defaultDate,
}: {
  venues: Option[];
  crew: Option[];
  projects: Option[];
  defaultDate: string; // YYYY-MM-DD
}) {
  const t = useT();
  const [open, setOpen] = React.useState(false);
  const [state, formAction, pending] = useActionState<State, FormData>(createActivity, null);
  const warning = state && "warning" in state ? state.warning : undefined;
  const error = state && "error" in state ? state.error : undefined;

  // Close + reset on a clean success (no error, no warning, after a submit).
  const submitted = React.useRef(false);
  React.useEffect(() => {
    if (pending) submitted.current = true;
    else if (submitted.current && state === null) {
      submitted.current = false;
      setOpen(false);
    }
  }, [pending, state]);

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="cta">
        {t("console.schedule.new", undefined, "+ New Activity")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>{t("console.schedule.newTitle", undefined, "New Activity")}</DialogTitle>
            <DialogDescription>
              {t(
                "console.schedule.newDesc",
                undefined,
                "Schedule a typed activity on the operational timeline. Guardrails check credential, double-book, rest, and weekly-hours before it lands.",
              )}
            </DialogDescription>
          </DialogHeader>
          <form action={formAction}>
            <DialogBody className="space-y-3">
              <Input name="name" label={t("console.schedule.f.name", undefined, "Name")} required />
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium text-[var(--p-text-2)]">
                    {t("console.schedule.f.kind", undefined, "Kind")}
                  </span>
                  <select name="activity_kind" defaultValue="general" className="ps-input mt-1.5 w-full">
                    {ACTIVITY_KINDS.map((k) => (
                      <option key={k.value} value={k.value}>
                        {k.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-[var(--p-text-2)]">
                    {t("console.schedule.f.laneKind", undefined, "Lane Kind")}
                  </span>
                  <select name="location_kind" defaultValue="venue" className="ps-input mt-1.5 w-full">
                    {LOCATION_KINDS.map((k) => (
                      <option key={k.value} value={k.value}>
                        {k.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  name="starts_at"
                  type="datetime-local"
                  defaultValue={`${defaultDate}T09:00`}
                  label={t("console.schedule.f.start", undefined, "Start")}
                  required
                />
                <Input
                  name="ends_at"
                  type="datetime-local"
                  defaultValue={`${defaultDate}T17:00`}
                  label={t("console.schedule.f.end", undefined, "End")}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium text-[var(--p-text-2)]">
                    {t("console.schedule.f.location", undefined, "Location")}
                  </span>
                  <select name="location_id" defaultValue="" className="ps-input mt-1.5 w-full">
                    <option value="">{t("console.schedule.f.none", undefined, "—")}</option>
                    {venues.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-[var(--p-text-2)]">
                    {t("console.schedule.f.resource", undefined, "Resource (Crew)")}
                  </span>
                  <select name="resource_ref" defaultValue="" className="ps-input mt-1.5 w-full">
                    <option value="">{t("console.schedule.f.none", undefined, "—")}</option>
                    {crew.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-medium text-[var(--p-text-2)]">
                  {t("console.schedule.f.project", undefined, "Project")}
                </span>
                <select name="project_id" defaultValue="" className="ps-input mt-1.5 w-full">
                  <option value="">{t("console.schedule.f.none", undefined, "—")}</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>

              {error && <p className="text-xs text-[var(--p-danger)]">{error}</p>}
              {warning && (
                <div className="rounded-[var(--p-r)] border border-[var(--p-warning)] bg-[var(--p-warning-tint,transparent)] p-2 text-xs text-[var(--p-warning-text,var(--p-text-1))]">
                  <p className="font-medium">
                    {t("console.schedule.warnHead", undefined, "Guardrail warning")}
                  </p>
                  <p className="mt-0.5">{warning}</p>
                  <label className="mt-2 flex items-center gap-2">
                    <input type="checkbox" name="override" value="1" />
                    {t("console.schedule.override", undefined, "Schedule anyway (override)")}
                  </label>
                </div>
              )}
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                {t("common.cancel", undefined, "Cancel")}
              </Button>
              <Button type="submit" loading={pending}>
                {t("console.schedule.create", undefined, "Create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
