"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdmin, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { emitAudit } from "@/lib/audit";
import { actionFail, formFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

const Schema = z.object({
  slug: z
    .string()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9_-]+$/, "Lowercase letters, digits, dashes only"),
  label: z.string().min(1).max(120),
  description: z.string().max(400).optional(),
  permissions: z.string().optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createCustomRole(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  // Creating org_roles assigns capabilities — must be owner/admin-only.
  // Without this gate, a non-admin could craft a POST that creates a
  // role with arbitrary `permissions[]` and then have an admin assign
  // it to them later (or themselves, if memberships.role is also
  // mutable from a different surface — see updatePerson).
  if (!isAdmin(session)) return { error: actionErrorMessage("auth.owner-admin.create-custom-roles", "Only owners and admins can create custom roles") };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const permissions = (parsed.data.permissions ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const { data: created, error } = await supabase
    .from("org_roles")
    .insert({
      org_id: session.orgId,
      slug: parsed.data.slug,
      label: parsed.data.label,
      description: parsed.data.description || null,
      permissions,
      is_system: false,
    })
    .select("id")
    .maybeSingle();
  if (error) return actionFail(error.message, fd);
  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "auth.org_role.created",
    targetTable: "org_roles",
    targetId: (created as { id: string } | null)?.id ?? null,
    metadata: { slug: parsed.data.slug, label: parsed.data.label, permissions },
  });
  revalidatePath("/studio/people/roles");
  return null;
}

export async function deleteCustomRole(formData: FormData) {
  const session = await requireSession();
  if (!isAdmin(session)) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  const { error, data: deleted } = await supabase
    .from("org_roles")
    .delete()
    .eq("id", id)
    .eq("org_id", session.orgId)
    .eq("is_system", false)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(`Could not delete org role: ${error.message}`);
  if (deleted) {
    await emitAudit({
      actorId: session.userId,
      orgId: session.orgId,
      actorEmail: session.email,
      action: "auth.org_role.deleted",
      targetTable: "org_roles",
      targetId: id,
    });
  }
  revalidatePath("/studio/people/roles");
}

/** W6 a11y — id-arg binding for `DeleteForm` (the confirm dialog invokes the
 * action directly rather than posting a hidden-input form). */
export async function deleteCustomRoleById(id: string): Promise<void> {
  const fd = new FormData();
  fd.set("id", id);
  await deleteCustomRole(fd);
}
