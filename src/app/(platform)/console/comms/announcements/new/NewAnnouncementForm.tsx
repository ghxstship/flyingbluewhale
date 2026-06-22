"use client";

import { useActionState, useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
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
 *
 * AI drafting (competitive parity with Connecteam "AI Text Enhancement" Sep 2025
 * and CventIQ content generation): a "Draft with AI" affordance pre-fills the
 * title + body from a brief topic description. The form stays a plain server
 * action — AI only seeds the controlled fields.
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

  // Controlled fields so AI can pre-fill them.
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");

  // AI draft state
  const [aiTopic, setAiTopic] = useState("");
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiPending, startAi] = useTransition();

  const generateDraft = () => {
    const trimmed = aiTopic.trim();
    if (!trimmed) {
      toast.error(t("console.comms.announcements.ai.topicRequired", undefined, "Enter a topic first"));
      return;
    }
    startAi(async () => {
      try {
        const res = await fetch("/api/v1/ai/announce-draft", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ topic: trimmed, audience }),
        });
        const json = (await res.json()) as { data?: { title: string; body: string }; error?: { message?: string } };
        if (!res.ok || !json.data) {
          toast.error(json.error?.message ?? t("console.comms.announcements.ai.error", undefined, "Draft generation failed"));
          return;
        }
        setTitle(json.data.title);
        setBody(json.data.body);
        setAiPanelOpen(false);
        setAiTopic("");
        toast.success(t("console.comms.announcements.ai.success", undefined, "Draft filled — review and publish"));
      } catch {
        toast.error(t("console.comms.announcements.ai.error", undefined, "Draft generation failed"));
      }
    });
  };

  return (
    <form action={formAction} className="surface space-y-4 p-6">
      {/* AI Draft affordance */}
      {!aiPanelOpen ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setAiPanelOpen(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-[var(--p-accent)] hover:underline"
          >
            <Sparkles className="size-3.5" />
            {t("console.comms.announcements.ai.trigger", undefined, "Draft with AI")}
          </button>
        </div>
      ) : (
        <div className="surface-inset rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--p-text-1)]">
            <Sparkles className="size-3.5 text-[var(--p-accent)]" />
            {t("console.comms.announcements.ai.heading", undefined, "Generate Announcement Draft")}
          </div>
          <p className="text-[11px] text-[var(--p-text-2)]">
            {t(
              "console.comms.announcements.ai.hint",
              undefined,
              "Describe the topic in a few words and AI will write the title and body. Review before publishing.",
            )}
          </p>
          <textarea
            value={aiTopic}
            onChange={(e) => setAiTopic(e.target.value)}
            placeholder={t(
              "console.comms.announcements.ai.topicPlaceholder",
              undefined,
              "e.g. New gate credentials process for festival weekend",
            )}
            rows={2}
            maxLength={500}
            className="ps-input w-full text-sm"
            disabled={aiPending}
          />
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={aiPending}
              onClick={() => { setAiPanelOpen(false); setAiTopic(""); }}
            >
              {t("common.cancel", undefined, "Cancel")}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={aiPending || !aiTopic.trim()}
              onClick={generateDraft}
            >
              <Sparkles className="size-3.5" />
              {aiPending
                ? t("console.comms.announcements.ai.generating", undefined, "Generating…")
                : t("console.comms.announcements.ai.generate", undefined, "Generate Draft")}
            </Button>
          </div>
        </div>
      )}

      <Input
        label={t("console.comms.announcements.new.title", undefined, "Title")}
        name="title"
        required
        maxLength={200}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.comms.announcements.new.body", undefined, "Body")}
        </span>
        <textarea
          name="body"
          rows={6}
          required
          maxLength={8000}
          className="ps-input focus-ring w-full"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
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
            <select
              name="audience"
              className="ps-input focus-ring w-full"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
            >
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
