"use client";

import { useState } from "react";
import { toast } from "@/lib/hooks/useToast";
import { Input } from "@/components/ui/Input";
import { FormShell, type FormState } from "@/components/FormShell";
import { upsertGuideAction } from "../actions";
import type { GuidePersona } from "@/lib/supabase/types";
import { useT } from "@/lib/i18n/LocaleProvider";

/** Returns the parse error message for invalid JSON, or null when valid. */
function jsonProblem(raw: string): string | null {
  if (!raw.trim()) return null;
  try {
    JSON.parse(raw);
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : "Invalid JSON";
  }
}

/**
 * FE-4 hardening — the raw-JSON guide editor now runs inside FormShell so it
 * inherits the dirty guard (beforeunload + in-app navigation interception)
 * and the standard error surface. Client-side JSON validation happens twice:
 * inline on textarea blur, and as a pre-submit check inside the action
 * wrapper so an invalid config never reaches the server action.
 */
export function GuideEditor({
  projectId,
  persona,
  defaultValues,
}: {
  projectId: string;
  persona: GuidePersona;
  defaultValues: { title: string; subtitle: string; classification: string; published: boolean; config: string };
}) {
  const t = useT();
  const [jsonError, setJsonError] = useState<string | null>(null);

  const invalidJsonMessage = (detail: string) =>
    t("console.projects.guides.editor.invalidJson", { detail }, `Config must be valid JSON: ${detail}`);

  const action = async (prev: FormState, fd: FormData): Promise<FormState> => {
    // Client-side validation before the round trip — same check the server
    // repeats, surfaced instantly with the parser's own message.
    const problem = jsonProblem(String(fd.get("config") ?? ""));
    if (problem) {
      setJsonError(problem);
      return { error: invalidJsonMessage(problem) };
    }
    const res = await upsertGuideAction(projectId, prev, fd);
    if (res?.error) toast.error(res.error);
    else toast.success(t("console.projects.guides.editor.savedToast", undefined, "Guide saved"));
    return res;
  };

  return (
    <FormShell
      action={action}
      dirtyGuard
      cancelHref={`/studio/projects/${projectId}/guides`}
      submitLabel={t("console.projects.guides.editor.saveButton", undefined, "Save Guide")}
    >
      <input type="hidden" name="persona" value={persona} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("console.projects.guides.editor.titleLabel", undefined, "Title")}
          name="title"
          required
          defaultValue={defaultValues.title}
        />
        <Input
          label={t("console.projects.guides.editor.subtitleLabel", undefined, "Subtitle")}
          name="subtitle"
          defaultValue={defaultValues.subtitle}
        />
      </div>
      <Input
        label={t("console.projects.guides.editor.classificationLabel", undefined, "Classification Banner")}
        name="classification"
        defaultValue={defaultValues.classification}
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" defaultChecked={defaultValues.published} />
        {t("console.projects.guides.editor.publishedLabel", undefined, "Published (Visible in Portal + Mobile)")}
      </label>
      <div>
        <label className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.projects.guides.editor.configLabel", undefined, "Config (JSON)")}
        </label>
        <textarea
          name="config"
          rows={24}
          spellCheck={false}
          defaultValue={defaultValues.config}
          aria-invalid={jsonError ? true : undefined}
          onBlur={(e) => setJsonError(jsonProblem(e.currentTarget.value))}
          className="ps-input mt-1.5 w-full font-mono text-xs"
        />
        {jsonError && (
          <p className="mt-1 text-xs text-[var(--p-danger)]" role="alert">
            {invalidJsonMessage(jsonError)}
          </p>
        )}
        <div className="mt-1 text-xs text-[var(--p-text-2)]">
          {t("console.projects.guides.editor.sectionsLabel", undefined, "Sections:")}{" "}
          <span className="font-mono">
            overview · schedule · set_times · timeline · credentials · contacts · faq · sops · ppe · radio · resources ·
            evacuation · fire_safety · accessibility · sustainability · code_of_conduct · custom
          </span>
        </div>
      </div>
    </FormShell>
  );
}
