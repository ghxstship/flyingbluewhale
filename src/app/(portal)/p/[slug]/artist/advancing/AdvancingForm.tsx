"use client";

import { useActionState, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { TemplatePicker } from "@/components/deliverable-templates/TemplatePicker";
import { submitDeliverableAction, type SubmitState } from "./actions";

const TALENT = [
  { type: "technical_rider", label: "Technical rider" },
  { type: "hospitality_rider", label: "Hospitality rider" },
  { type: "input_list", label: "Input list" },
  { type: "stage_plot", label: "Stage plot" },
  { type: "crew_list", label: "Touring crew list" },
  { type: "guest_list", label: "Guest list" },
  { type: "custom", label: "Other" },
];

export function AdvancingForm({ slug }: { slug: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("technical_rider");
  const [notes, setNotes] = useState("");
  const [state, formAction, pending] = useActionState<SubmitState, FormData>(
    async (prev, fd) => {
      const result = await submitDeliverableAction(prev, fd);
      if (result?.ok) {
        toast.success("Deliverable submitted");
        formRef.current?.reset();
        setTitle("");
        setNotes("");
      } else if (result?.error) {
        toast.error(result.error);
      }
      return result;
    },
    null,
  );

  return (
    <form ref={formRef} action={formAction} className="surface-raised space-y-4 p-6">
      <input type="hidden" name="slug" value={slug} />
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">New deliverable</div>
        <TemplatePicker
          onPick={(t) => {
            setType(t.type);
            if (!title) setTitle(t.name);
            const prefill =
              typeof (t.data as { notes?: unknown } | null)?.notes === "string"
                ? String((t.data as { notes: string }).notes)
                : t.description ?? "";
            if (prefill) setNotes(prefill);
            toast.success(`Applied ${t.name}`);
          }}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Title"
          name="title"
          required
          maxLength={200}
          placeholder="Stage plot v3"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">Type</label>
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="input-base mt-1.5 w-full"
            required
          >
            {TALENT.map((t) => <option key={t.type} value={t.type}>{t.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">Notes</label>
        <textarea
          name="notes"
          rows={3}
          maxLength={4000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input-base mt-1.5 w-full"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">File (optional, ≤25MB)</label>
          <input type="file" name="file" className="input-base mt-1.5 w-full" accept=".pdf,.png,.jpg,.jpeg,.svg,.txt,.doc,.docx,.csv" />
        </div>
        <Input label="Deadline" name="deadline" type="date" />
      </div>
      {state?.error ? <Alert kind="error">{state.error}</Alert> : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>{pending ? "Uploading…" : "Submit deliverable"}</Button>
      </div>
    </form>
  );
}
