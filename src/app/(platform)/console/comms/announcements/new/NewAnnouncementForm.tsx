"use client";

import { useActionState, useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
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
  const [draftPending, startDraft] = useTransition();
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [titleVal, setTitleVal] = useState(state?.values?.title ?? "");
  const [bodyVal, setBodyVal] = useState(state?.values?.body ?? "");
  const [audienceVal, setAudienceVal] = useState<string>(state?.values?.audience ?? "all");

  const draftWithAi = () => {
    if (!aiPrompt.trim()) return;
    setDraftError(null);
    startDraft(async () => {
      try {
        const res = await fetch("/api/v1/ai/draft-announcement", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ prompt: aiPrompt.trim(), audience: audienceVal }),
        });
        const json = (await res.json()) as { ok: boolean; data?: { title: string; body: string }; error?: { message: string } };
        if (!json.ok || !json.data) {
          setDraftError(json.error?.message ?? "Draft failed. Try again.");
          return;
        }
        setTitleVal(json.data.title ?? "");
        setBodyVal(json.data.body ?? "");
        setShowAiPanel(false);
        setAiPrompt("");
      } catch {
        setDraftError("Network error. Check your connection and try again.");
      }
    });
  };

  return (
    <div className="space-y-3">
      {/* AI draft panel */}
      <div className="surface overflow-hidden rounded-lg border border-[var(--p-border)]">
        <button
          type="button"
          onClick={() => setShowAiPanel((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-3 text-sm font-medium hover:bg-[var(--p-surface-raised)] transition-colors"
        >
          <span className="flex items-center gap-2">
            <Sparkles size={14} className="text-[var(--p-accent)]" aria-hidden="true" />
            {t("console.comms.announcements.new.draftWithAi", undefined, "Draft with AI")}
          </span>
          <span className="text-[11px] text-[var(--p-text-2)]">{showAiPanel ? "▲" : "▼"}</span>
        </button>
        {showAiPanel && (
          <div className="border-t border-[var(--p-border)] px-5 py-4 space-y-3">
            <p className="text-xs text-[var(--p-text-2)]">
              {t("console.comms.announcements.new.draftHint", undefined, "Describe what you need to communicate and we'll draft the title and body.")}
            </p>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-[var(--p-text-2)]">
                {t("console.comms.announcements.new.promptLabel", undefined, "What's the announcement about?")}
              </span>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder={t("console.comms.announcements.new.promptPlaceholder", undefined, "e.g. Load-in tomorrow starts at 06:00. All crew must check in at Gate B. Safety briefing mandatory before rigging.")}
                className="ps-input w-full text-sm"
              />
            </label>
            {draftError && (
              <p className="text-xs text-[var(--p-danger)]">{draftError}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAiPanel(false)}>
                {t("common.cancel", undefined, "Cancel")}
              </Button>
              <Button type="button" size="sm" disabled={draftPending || !aiPrompt.trim()} onClick={draftWithAi}>
                {draftPending
                  ? t("console.comms.announcements.new.drafting", undefined, "Drafting…")
                  : t("console.comms.announcements.new.draft", undefined, "Draft")}
              </Button>
            </div>
          </div>
        )}
      </div>

    <form action={formAction} className="surface space-y-4 p-6">
      <Input
        label={t("console.comms.announcements.new.title", undefined, "Title")}
        name="title"
        required
        maxLength={200}
        value={titleVal}
        onChange={(e) => setTitleVal(e.target.value)}
      />
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.comms.announcements.new.body", undefined, "Body")}
        </span>
        <textarea name="body" rows={6} required maxLength={8000} className="ps-input focus-ring w-full"
          value={bodyVal} onChange={(e) => setBodyVal(e.target.value)} />
      </label>

      <fieldset className="space-y-3 rounded-md border border-[var(--p-border)] p-3">
        <legend className="px-1 text-[10px] font-semibold tracking-wide text-[var(--p-text-2)] uppercase">
          {t("console.comms.announcements.new.audience", undefined, "Audience")}
        </legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.comms.announcements.new.roleBand", undefined, "Role Band")}
            </span>
            <select name="audience" className="ps-input focus-ring w-full" value={audienceVal} onChange={(e) => setAudienceVal(e.target.value)}>
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
              {t("console.comms.announcements.new.project", undefined, "Project")}
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
              {t("console.comms.announcements.new.team", undefined, "Team")}
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
    </div>
  );
}
