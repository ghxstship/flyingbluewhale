"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { addTeamMember, createTeam, deleteTeam, removeTeamMember, updateTeam, updateTeamMember } from "@/lib/db/teams";
import { formFail } from "@/lib/forms/fail";

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

const SLUG_RE = /^[a-z0-9-]{1,40}$/;

const CreateSchema = z.object({
  slug: z.string().regex(SLUG_RE, "Slug must be lowercase letters, digits, hyphens (1-40 chars)"),
  name: z.string().min(1, "Name is required").max(120),
  description: z.string().max(500).optional().or(z.literal("")),
});

const UpdateSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional().or(z.literal("")),
});

const AddMemberSchema = z.object({
  user_id: z.string().uuid("Pick a member"),
  role: z.enum(["admin", "member"]).default("member"),
});

const UpdateMemberRoleSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(["admin", "member"]),
});

export async function createTeamAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only managers and above can create teams." };

  const parsed = CreateSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  try {
    const team = await createTeam({
      orgId: session.orgId,
      slug: parsed.data.slug,
      name: parsed.data.name,
      description: parsed.data.description?.trim() || null,
    });
    revalidatePath("/console/people/teams");
    redirect(`/console/people/teams/${team.id}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create team";
    if (/duplicate|23505/.test(msg)) {
      return { error: "A team with that slug already exists in this org." };
    }
    return { error: msg };
  }
}

export async function updateTeamAction(teamId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only managers and above can edit teams." };

  const parsed = UpdateSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  try {
    await updateTeam({
      id: teamId,
      name: parsed.data.name,
      description: parsed.data.description?.trim() || null,
    });
    revalidatePath(`/console/people/teams/${teamId}`);
    revalidatePath("/console/people/teams");
    return { ok: true } as unknown as State;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update team" };
  }
}

export async function deleteTeamAction(teamId: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  await deleteTeam({ id: teamId });
  revalidatePath("/console/people/teams");
  redirect("/console/people/teams");
}

export async function addMemberAction(teamId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only managers and above can add members." };

  const parsed = AddMemberSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  try {
    await addTeamMember({ teamId, userId: parsed.data.user_id, role: parsed.data.role });
    revalidatePath(`/console/people/teams/${teamId}`);
    return { ok: true } as unknown as State;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to add member";
    if (/duplicate|23505/.test(msg)) return { error: "That user is already on this team." };
    return { error: msg };
  }
}

export async function updateMemberRoleAction(teamId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only managers and above can change roles." };

  const parsed = UpdateMemberRoleSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  try {
    await updateTeamMember({ teamId, userId: parsed.data.user_id, role: parsed.data.role });
    revalidatePath(`/console/people/teams/${teamId}`);
    return { ok: true } as unknown as State;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update role" };
  }
}

export async function removeMemberAction(teamId: string, userId: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  await removeTeamMember({ teamId, userId });
  revalidatePath(`/console/people/teams/${teamId}`);
}
