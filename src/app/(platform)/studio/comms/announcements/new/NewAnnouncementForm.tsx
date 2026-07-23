"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createAnnouncementAction, type State } from "./actions";

import { useActionErrorResolver } from "@/lib/errors-client";
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
  const resolveErr = useActionErrorResolver();

  return (
    <form action={formAction} className="surface space-y-4 p-6">
      <Input
        label={t("console.comms.announcements.new.title", undefined, "Title")}
        name="title"
        required
        maxLength={200}
      />
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.comms.announcements.new.body", undefined, "Body")}
        </span>
        <textarea name="body" rows={6} required maxLength={8000} className="ps-input focus-ring w-full" />
      </label>

      <fieldset className="space-y-3 rounded-md border border-[var(--p-border)] p-3">
        <legend className="px-1 text-[11px] font-semibold tracking-wide text-[var(--p-text-2)] uppercase">
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
            "Filters AND together. Recipients must match every populated filter. Leave Project + Team blank to reach the full role band.",
          )}
        </p>
      </fieldset>

      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" name="pinned" />{" "}
        {t("console.comms.announcements.new.pinToTop", undefined, "Pin To Top Of Feed")}
      </label>
      {state?.error ? <Alert kind="error">{resolveErr(state.error)}</Alert> : null}
      <div className="flex items-center justify-end gap-2">
        <Button href="/studio/comms/announcements" variant="ghost">
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
