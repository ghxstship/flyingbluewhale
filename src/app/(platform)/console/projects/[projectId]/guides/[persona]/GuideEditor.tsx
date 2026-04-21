"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { upsertGuideAction, type State } from "../actions";
import type { GuidePersona } from "@/lib/supabase/types";

export function GuideEditor({
  projectId,
  persona,
  defaultValues,
}: {
  projectId: string;
  persona: GuidePersona;
  defaultValues: { title: string; subtitle: string; classification: string; published: boolean; config: string };
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    async (prev, fd) => {
      const res = await upsertGuideAction(projectId, prev, fd);
      if (res?.error) toast.error(res.error);
      else toast.success("Guide saved");
      return res;
    },
    null,
  );

  return (
    <form action={formAction} className="surface-raised space-y-4 p-6">
      <input type="hidden" name="persona" value={persona} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Title" name="title" required defaultValue={defaultValues.title} />
        <Input label="Subtitle" name="subtitle" defaultValue={defaultValues.subtitle} />
      </div>
      <Input label="Classification banner" name="classification" defaultValue={defaultValues.classification} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" defaultChecked={defaultValues.published} />
        Published (visible in portal + mobile)
      </label>
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">Config (JSON)</label>
        <textarea
          name="config"
          rows={24}
          spellCheck={false}
          defaultValue={defaultValues.config}
          className="input-base mt-1.5 w-full font-mono text-xs"
        />
        <div className="mt-1 text-xs text-[var(--text-muted)]">
          Sections: <span className="font-mono">overview · schedule · set_times · timeline · credentials · contacts · faq · sops · ppe · radio · resources · evacuation · fire_safety · accessibility · sustainability · code_of_conduct · custom</span>
        </div>
      </div>
      {state?.error && <Alert kind="error">{state.error}</Alert>}
      <div className="flex items-center justify-end gap-2">
        <Button href={`/console/projects/${projectId}/guides`} variant="ghost">Back</Button>
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save guide"}</Button>
      </div>
    </form>
  );
}
