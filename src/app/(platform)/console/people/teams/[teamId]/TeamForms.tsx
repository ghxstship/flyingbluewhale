"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
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
  const bound = updateTeamAction.bind(null, teamId);
  return (
    <FormShell action={bound} submitLabel="Save Changes" dirtyGuard>
      <Input label="Name" name="name" defaultValue={defaultName} required autoComplete="off" />
      <Input label="Description" name="description" defaultValue={defaultDescription} autoComplete="off" />
    </FormShell>
  );
}

function AddMember({ teamId, eligible }: { teamId: string; eligible: { id: string; label: string }[] }) {
  const bound = addMemberAction.bind(null, teamId);
  return (
    <FormShell action={bound} submitLabel="Add Member">
      <label className="block text-xs font-medium">
        <span className="mb-1 block">Member</span>
        <select name="user_id" className="input-base focus-ring w-full" required defaultValue="">
          <option value="" disabled>
            Select an org member…
          </option>
          {eligible.map((e) => (
            <option key={e.id} value={e.id}>
              {e.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs font-medium">
        <span className="mb-1 block">Team role</span>
        <select name="role" className="input-base focus-ring w-full" defaultValue="member">
          <option value="member">Member</option>
          <option value="admin">Admin (can manage this team&apos;s members)</option>
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
  const bound = updateMemberRoleAction.bind(null, teamId);
  const [state, formAction, pending] = useActionState<State, FormData>(bound, null);
  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="user_id" value={userId} />
      <select
        name="role"
        defaultValue={defaultRole}
        className="input-base focus-ring text-xs"
        disabled={pending}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        <option value="member">Member</option>
        <option value="admin">Admin</option>
      </select>
      {state?.error && (
        <span role="alert" className="text-[10px] text-[var(--color-error)]">
          {state.error}
        </span>
      )}
    </form>
  );
}

function RemoveMember({ teamId, userId }: { teamId: string; userId: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={async () => {
        if (!confirm("Remove this member from the team?")) return;
        await removeMemberAction(teamId, userId);
      }}
    >
      Remove
    </Button>
  );
}

function DeleteTeam({ teamId }: { teamId: string }) {
  return (
    <Button
      type="button"
      variant="danger"
      size="sm"
      onClick={async () => {
        if (
          !confirm(
            "Delete this team? Members will be detached and any team-scoped record grants will be revoked. This cannot be undone.",
          )
        ) {
          return;
        }
        await deleteTeamAction(teamId);
      }}
    >
      Delete Team
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
