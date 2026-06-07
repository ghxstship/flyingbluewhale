"use client";

import { useActionState, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { TemplatePicker } from "@/components/deliverable-templates/TemplatePicker";
import { useT } from "@/lib/i18n/LocaleProvider";
import { submitDeliverableAction, type SubmitState } from "./actions";

export function AdvancingForm({ slug }: { slug: string }) {
  const t = useT();
  const TALENT = [
    { type: "technical_rider", label: t("p.artist.advancing.type.technical_rider", undefined, "Technical Rider") },
    {
      type: "hospitality_rider",
      label: t("p.artist.advancing.type.hospitality_rider", undefined, "Hospitality Rider"),
    },
    { type: "input_list", label: t("p.artist.advancing.type.input_list", undefined, "Input List") },
    { type: "stage_plot", label: t("p.artist.advancing.type.stage_plot", undefined, "Stage Plot") },
    { type: "crew_list", label: t("p.artist.advancing.type.crew_list", undefined, "Touring Crew List") },
    { type: "guest_list", label: t("p.artist.advancing.type.guest_list", undefined, "Guest List") },
    { type: "custom", label: t("p.artist.advancing.type.custom", undefined, "Other") },
  ];
  const formRef = useRef<HTMLFormElement>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("technical_rider");
  const [notes, setNotes] = useState("");
  const [state, formAction, pending] = useActionState<SubmitState, FormData>(async (prev, fd) => {
    const result = await submitDeliverableAction(prev, fd);
    if (result?.ok) {
      toast.success(t("p.artist.advancing.toast.submitted", undefined, "Deliverable submitted"));
      formRef.current?.reset();
      setTitle("");
      setNotes("");
    } else if (result?.error) {
      toast.error(result.error);
    }
    return result;
  }, null);

  return (
    <form ref={formRef} action={formAction} className="surface space-y-4 p-6">
      <input type="hidden" name="slug" value={slug} />
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">
          {t("p.artist.advancing.form.newDeliverable", undefined, "New deliverable")}
        </div>
        <TemplatePicker
          onPick={(tpl) => {
            setType(tpl.type);
            if (!title) setTitle(tpl.name);
            const prefill =
              typeof (tpl.data as { notes?: unknown } | null)?.notes === "string"
                ? String((tpl.data as { notes: string }).notes)
                : (tpl.description ?? "");
            if (prefill) setNotes(prefill);
            toast.success(t("p.artist.advancing.toast.applied", { name: tpl.name }, `Applied ${tpl.name}`));
          }}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("p.artist.advancing.form.title.label", undefined, "Title")}
          name="title"
          required
          maxLength={200}
          placeholder={t("p.artist.advancing.form.title.placeholder", undefined, "Stage plot v3")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div>
          <label className="text-xs font-medium text-[var(--p-text-2)]">
            {t("p.artist.advancing.form.type.label", undefined, "Type")}
          </label>
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="ps-input mt-1.5 w-full"
            required
          >
            {TALENT.map((item) => (
              <option key={item.type} value={item.type}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--p-text-2)]">
          {t("p.artist.advancing.form.notes.label", undefined, "Notes")}
        </label>
        <textarea
          name="notes"
          rows={3}
          maxLength={4000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="ps-input mt-1.5 w-full"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-[var(--p-text-2)]">
            {t("p.artist.advancing.form.file.label", undefined, "File · Optional · ≤25MB")}
          </label>
          <input
            type="file"
            name="file"
            className="ps-input mt-1.5 w-full"
            accept=".pdf,.png,.jpg,.jpeg,.svg,.txt,.doc,.docx,.csv"
          />
        </div>
        <Input label={t("p.artist.advancing.form.deadline.label", undefined, "Deadline")} name="deadline" type="date" />
      </div>
      {state?.error ? <Alert kind="error">{state.error}</Alert> : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending
            ? t("p.artist.advancing.form.uploading", undefined, "Uploading…")
            : t("p.artist.advancing.form.submit", undefined, "Submit deliverable")}
        </Button>
      </div>
    </form>
  );
}
