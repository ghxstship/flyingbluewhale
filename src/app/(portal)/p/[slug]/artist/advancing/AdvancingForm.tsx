"use client";

import { useActionState, useRef } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
  const [state, formAction, pending] = useActionState<SubmitState, FormData>(
    async (prev, fd) => {
      const result = await submitDeliverableAction(prev, fd);
      if (result?.ok) {
        toast.success("Deliverable submitted");
        formRef.current?.reset();
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
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Title" name="title" required maxLength={200} placeholder="Stage plot v3" />
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">Type</label>
          <select name="type" className="input-base mt-1.5 w-full" defaultValue="technical_rider" required>
            {TALENT.map((t) => <option key={t.type} value={t.type}>{t.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">Notes</label>
        <textarea name="notes" rows={3} maxLength={4000} className="input-base mt-1.5 w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">File (optional, ≤25MB)</label>
          <input type="file" name="file" className="input-base mt-1.5 w-full" accept=".pdf,.png,.jpg,.jpeg,.svg,.txt,.doc,.docx,.csv" />
        </div>
        <Input label="Deadline" name="deadline" type="date" />
      </div>
      {state?.error ? (
        <div className="rounded-lg border border-[var(--color-error)]/40 bg-[var(--color-error)]/10 p-2 text-xs text-[var(--color-error)]">
          {state.error}
        </div>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>{pending ? "Uploading…" : "Submit deliverable"}</Button>
      </div>
    </form>
  );
}
