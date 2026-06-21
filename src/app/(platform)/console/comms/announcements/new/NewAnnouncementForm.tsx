"use client";

import { useActionState, useRef, useTransition, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createAnnouncementAction, type State } from "./actions";

/**
 * Announcement composer. Audience targeting works as three layered
 * filters that AND together (server-side fan-out reads all three):
 *
 *   • Role band   — coarse audience enum (all/crew/contractors/vendors/admins)
 *   • Project     — optional org-wide-OR-this-project scope
 *   • Team        — optional named-team scope
 *
 * Two distinct submit buttons (Save Draft + Publish Now) avoid the
 * old click-race between a publish-now checkbox and the submit. The
 * Publish Now button names `publish_now=on`; Save Draft doesn't.
 */
export function NewAnnouncementForm({
  projects,
  teams,
}: {
  projects: Array<{ id: string; name: string }>;
  teams: Array<{ id: string; name: string }>;
}) {
  const t = useT();
  const [state, formAction, pending] = useActionState<State, FormData>(createAnnouncementAction, null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [aiPending, startAi] = useTransition();
  const [aiError, setAiError] = useState<string | null>(null);

  const enhanceBody = () => {
    const currentBody = bodyRef.current?.value ?? "";
    const titleEl = document.querySelector<HTMLInputElement>('[name="title"]');
    const currentTitle = titleEl?.value ?? "";
    const text = currentTitle ? `Title: ${currentTitle}\n\nBody:\n${currentBody}` : currentBody;
    if (!text.trim()) return;
    setAiError(null);
    startAi(async () => {
      try {
        const res = await fetch("/api/v1/ai/enhance-text", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text, context: "announcement" }),
        });
        const json = (await res.json()) as {
          ok: boolean;
          data?: { enhanced: string };
          error?: { message: string };
        };
        if (!json.ok || !json.data) {
          setAiError(json.error?.message ?? "Enhancement failed; try again.");
          return;
        }
        if (bodyRef.current) bodyRef.current.value = json.data.enhanced;
      } catch {
        setAiError("Network error; try again.");
      }
    });
  };

  return (
    <form action={formAction} className="surface space-y-4 p-6">
      <Input
        label={t("console.comms.announcements.new.title", undefined, "Title")}
        name="title"
        required
        maxLength={200}
      />
      <label className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.comms.announcements.new.body", undefined, "Body")}
          </span>
          <button
            type="button"
            onClick={enhanceBody}
            disabled={aiPending}
            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium text-[var(--p-accent)] hover:bg-[var(--p-surface-raised)] transition-colors disabled:opacity-50"
            title="Rewrite with AI"
          >
            <span>✦</span>
            {aiPending ? "Enhancing…" : "Enhance with AI"}
          </button>
        </div>
        <textarea ref={bodyRef} name="body" rows={6} required maxLength={8000} className="ps-input focus-ring w-full" />
        {aiError && <p className="text-[11px] text-[var(--p-danger-text)]">{aiError}</p>}
      </label>

      <fieldset className="space-y-3 rounded-md border border-[var(--p-border)] p-3">
        <legend className="px-1 text-[10px] font-semibold tracking-wide text-[var(--p-text-2)] uppercase">
          {t("console.comms.announcements.new.audience", undefined, "Audience")}
        </legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.comms.announcements.new.roleBandLabel", undefined, "Role Band")}
            </span>
            <select name="audience" className="ps-input focus-ring w-full" defaultValue="all">
              <option value="all">
                {t("console.comms.announcements.new.roleBand.everyone", undefined, "Everyone")}
              </option>
              <option value="crew">{t("console.comms.announcements.new.roleBand.crew", undefined, "Crew")}</option>
              <option value="contractors">
                {t("console.comms.announcements.new.roleBand.contractors", undefined, "Contractors")}
              </option>
              <option value="vendors">
                {t("console.comms.announcements.new.roleBand.vendors", undefined, "Vendors")}
              </option>
              <option value="admins">
                {t("console.comms.announcements.new.roleBand.admins", undefined, "Admins")}
              </option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.comms.announcements.new.projectLabel", undefined, "Project")}
            </span>
            <select name="project_id" className="ps-input focus-ring w-full" defaultValue="">
              <option value="">
                {t("console.comms.announcements.new.project.any", undefined, "Org-wide · Any Project")}
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.comms.announcements.new.teamLabel", undefined, "Team")}
            </span>
            <select name="team_id" className="ps-input focus-ring w-full" defaultValue="">
              <option value="">{t("console.comms.announcements.new.team.any", undefined, "Any team")}</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="text-[11px] text-[var(--p-text-2)]">
          {t(
            "console.comms.announcements.new.filtersHint",
            undefined,
            "Filters AND together — recipients must match every populated filter. Leave Project + Team blank to reach the full role band.",
          )}
        </p>
      </fieldset>

      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" name="pinned" />{" "}
        {t("console.comms.announcements.new.pinToTop", undefined, "Pin To Top Of Feed")}
      </label>
      {state?.error ? <Alert kind="error">{state.error}</Alert> : null}
      <div className="flex items-center justify-end gap-2">
        <Button href="/console/comms/announcements" variant="ghost">
          {t("common.cancel", undefined, "Cancel")}
        </Button>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending
            ? t("console.comms.announcements.new.saving", undefined, "Saving…")
            : t("console.comms.announcements.new.saveDraft", undefined, "Save Draft")}
        </Button>
        <Button type="submit" name="publish_now" value="on" disabled={pending}>
          {pending
            ? t("console.comms.announcements.new.publishing", undefined, "Publishing…")
            : t("console.comms.announcements.new.publishNow", undefined, "Publish Now")}
        </Button>
      </div>
    </form>
  );
}
