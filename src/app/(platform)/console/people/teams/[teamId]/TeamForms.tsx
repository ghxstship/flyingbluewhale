"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import {
  addMemberAction,
  deleteTeamAction,
  removeMemberAction,
  updateMemberRoleAction,
  updateTeamAction,
  type State,
} from "./actions";

/**
 * Client-side form wrappers for team detail. Each one binds an action with
 * the specific teamId / userId so the server action signature stays
 * `(state, fd) => Promise<State>` — what `useActionState` + `FormShell` expect.
 */

function EditTeam({
  teamId,
  defaultName,
  defaultDescription,
}: {
  teamId: string;
  defaultName: string;
  defaultDescription: string;
}) {
  const t = useT();
  const bound = updateTeamAction.bind(null, teamId);
  return (
    <FormShell action={bound} submitLabel={t("common.saveChanges", undefined, "Save Changes")} dirtyGuard>
      <Input
        label={t("console.people.teams.edit.name", undefined, "Name")}
        name="name"
        defaultValue={defaultName}
        required
        autoComplete="off"
      />
      <Input
        label={t("console.people.teams.edit.description", undefined, "Description")}
        name="description"
        defaultValue={defaultDescription}
        autoComplete="off"
      />
    </FormShell>
  );
}

function AddMember({ teamId, eligible }: { teamId: string; eligible: { id: string; label: string }[] }) {
  const t = useT();
  const bound = addMemberAction.bind(null, teamId);
  return (
    <FormShell action={bound} submitLabel={t("console.people.teams.addMember.submit", undefined, "Add Member")}>
      <label className="block text-xs font-medium">
        <span className="mb-1 block">{t("console.people.teams.addMember.memberLabel", undefined, "Member")}</span>
        <select name="user_id" className="ps-input focus-ring w-full" required defaultValue="">
          <option value="" disabled>
            {t("console.people.teams.addMember.selectPlaceholder", undefined, "Select an org member…")}
          </option>
          {eligible.map((e) => (
            <option key={e.id} value={e.id}>
              {e.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs font-medium">
        <span className="mb-1 block">{t("console.people.teams.addMember.teamRoleLabel", undefined, "Team role")}</span>
        <select name="role" className="ps-input focus-ring w-full" defaultValue="member">
          <option value="member">{t("console.people.teams.roles.member", undefined, "Member")}</option>
          <option value="admin">
            {t("console.people.teams.addMember.adminOption", undefined, "Admin — Can Manage This Team's Members")}
          </option>
        </select>
      </label>
    </FormShell>
  );
}

function UpdateMemberRole({
  teamId,
  userId,
  defaultRole,
}: {
  teamId: string;
  userId: string;
  defaultRole: "admin" | "member";
}) {
  const t = useT();
  const bound = updateMemberRoleAction.bind(null, teamId);
  const [state, formAction, pending] = useActionState<State, FormData>(bound, null);
  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="user_id" value={userId} />
      <select
        name="role"
        defaultValue={defaultRole}
        className="ps-input focus-ring text-xs"
        disabled={pending}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        <option value="member">{t("console.people.teams.roles.member", undefined, "Member")}</option>
        <option value="admin">{t("console.people.teams.roles.admin", undefined, "Admin")}</option>
      </select>
      {state?.error && (
        <span role="alert" className="text-[10px] text-[var(--p-danger)]">
          {state.error}
        </span>
      )}
    </form>
  );
}

function RemoveMember({ teamId, userId }: { teamId: string; userId: string }) {
  const t = useT();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={async () => {
        if (!confirm(t("console.people.teams.removeMember.confirm", undefined, "Remove this member from the team?")))
          return;
        await removeMemberAction(teamId, userId);
      }}
    >
      {t("common.remove", undefined, "Remove")}
    </Button>
  );
}

function DeleteTeam({ teamId }: { teamId: string }) {
  const t = useT();
  return (
    <Button
      type="button"
      variant="danger"
      size="sm"
      onClick={async () => {
        if (
          !confirm(
            t(
              "console.people.teams.deleteTeam.confirm",
              undefined,
              "Delete this team? Members will be detached and any team-scoped record grants will be revoked. This cannot be undone.",
            ),
          )
        ) {
          return;
        }
        await deleteTeamAction(teamId);
      }}
    >
      {t("console.people.teams.deleteTeam.action", undefined, "Delete Team")}
    </Button>
  );
}

export const TeamForms = {
  EditTeam,
  AddMember,
  UpdateMemberRole,
  RemoveMember,
  DeleteTeam,
};
