"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { addProjectMemberAction, removeProjectMemberAction, updateProjectMemberRoleAction } from "./actions";
import { PROJECT_ROLES, type ProjectRole } from "@/lib/supabase/types";
import type { FormState } from "@/components/FormShell";
import { useT } from "@/lib/i18n/LocaleProvider";

import { useActionErrorResolver } from "@/lib/errors-client";
export type Candidate = { user_id: string; email: string; name: string | null };
export type MemberRowData = {
  user_id: string;
  role: ProjectRole;
  email: string;
  name: string | null;
};

export function AddMemberForm({ projectId, candidates }: { projectId: string; candidates: Candidate[] }) {
  const router = useRouter();
  const t = useT();
  const action = addProjectMemberAction.bind(null, projectId);
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null);
  const resolveErr = useActionErrorResolver();

  useEffect(() => {
    if (state?.ok) {
      toast.success(t("console.projects.members.addedToast", undefined, "Member added"));
      router.refresh();
    } else if (state?.error) {
      toast.error(resolveErr(state.error));
    }
  }, [state, router, t, resolveErr]);

  if (candidates.length === 0) {
    return (
      <Alert kind="info">
        {t(
          "console.projects.members.noCandidatesPrefix",
          undefined,
          "No org members available to add. Invite someone via",
        )}{" "}
        <Link href="/studio/people/invites" className="underline">
          {t("console.projects.members.peopleInvitesLink", undefined, "People → Invites")}
        </Link>{" "}
        {t("console.projects.members.noCandidatesSuffix", undefined, "first.")}
      </Alert>
    );
  }

  return (
    <form action={formAction} className="surface space-y-4 p-4">
      <div className="grid gap-3 sm:grid-cols-[2fr_1fr_auto]">
        <label className="space-y-1 text-xs">
          <div className="tracking-wide text-[var(--p-text-2)] uppercase">
            {t("console.projects.members.orgMemberLabel", undefined, "Org Member")}
          </div>
          <select
            name="userId"
            required
            className="w-full rounded-md border border-[var(--p-border)] bg-[var(--p-surface)] p-2 text-sm"
          >
            <option value="">
              {t("console.projects.members.selectMemberPlaceholder", undefined, "Select a member…")}
            </option>
            {candidates.map((c) => (
              <option key={c.user_id} value={c.user_id}>
                {c.name ? `${c.name} (${c.email})` : c.email}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs">
          <div className="tracking-wide text-[var(--p-text-2)] uppercase">
            {t("console.projects.members.projectRoleLabel", undefined, "Project Role")}
          </div>
          <select
            name="role"
            defaultValue="contributor"
            required
            className="w-full rounded-md border border-[var(--p-border)] bg-[var(--p-surface)] p-2 text-sm"
          >
            {PROJECT_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <Button type="submit" loading={pending}>
            {pending
              ? t("console.projects.members.addingButton", undefined, "Adding")
              : t("console.projects.members.addButton", undefined, "Add")}
          </Button>
        </div>
      </div>
      {state?.error && !state?.ok && <Alert kind="error">{resolveErr(state.error)}</Alert>}
    </form>
  );
}

export function MemberRow({
  projectId,
  member,
  currentUserId,
}: {
  projectId: string;
  member: MemberRowData;
  currentUserId: string;
}) {
  const router = useRouter();
  const t = useT();
  const updateAction = updateProjectMemberRoleAction.bind(null, projectId);
  const [, updateFormAction, updating] = useActionState<FormState, FormData>(updateAction, null);
  const [removing, setRemoving] = useState(false);
  // CN-9 — accessible confirm dialog replaces native confirm().
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function onChangeRole(role: string) {
    const fd = new FormData();
    fd.set("userId", member.user_id);
    fd.set("role", role);
    updateFormAction(fd);
  }

  async function onRemove() {
    setRemoving(true);
    try {
      await removeProjectMemberAction(projectId, member.user_id);
      toast.success(t("console.projects.members.removedToast", undefined, "Member removed"));
      router.refresh();
    } finally {
      setRemoving(false);
      setConfirmOpen(false);
    }
  }

  const isSelf = member.user_id === currentUserId;

  return (
    <tr>
      <td>
        <div className="font-medium">{member.name ?? member.email}</div>
        {member.name && <div className="text-xs text-[var(--p-text-2)]">{member.email}</div>}
      </td>
      <td>
        <select
          aria-label={t("console.projects.members.roleForAria", { email: member.email }, `Role for ${member.email}`)}
          defaultValue={member.role}
          disabled={updating}
          onChange={(e) => onChangeRole(e.currentTarget.value)}
          className="rounded-md border border-[var(--p-border)] bg-[var(--p-surface)] p-1 text-xs"
        >
          {PROJECT_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </td>
      <td className="text-right">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setConfirmOpen(true)}
          loading={removing}
          disabled={removing}
        >
          {isSelf
            ? t("console.projects.members.leaveButton", undefined, "Leave")
            : t("console.projects.members.removeButton", undefined, "Remove")}
        </Button>
        <Dialog open={confirmOpen} onOpenChange={(o) => (!removing && !o ? setConfirmOpen(false) : null)}>
          <DialogContent size="sm">
            <DialogHeader>
              <DialogTitle>
                {isSelf
                  ? t("console.projects.members.leaveDialogTitle", undefined, "Leave Project")
                  : t("console.projects.members.removeDialogTitle", undefined, "Remove Member")}
              </DialogTitle>
              <DialogDescription>
                {t(
                  "console.projects.members.removeConfirm",
                  { name: member.name ?? member.email },
                  `Remove ${member.name ?? member.email} from this project?`,
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setConfirmOpen(false)} disabled={removing}>
                {t("common.cancel", undefined, "Cancel")}
              </Button>
              <Button type="button" variant="danger" loading={removing} onClick={() => void onRemove()}>
                {isSelf
                  ? t("console.projects.members.leaveButton", undefined, "Leave")
                  : t("console.projects.members.removeButton", undefined, "Remove")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </td>
    </tr>
  );
}
