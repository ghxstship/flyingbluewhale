"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { writeInbox } from "@/lib/inbox";
import { CATALOG_KIND_LABEL_SINGULAR, type CatalogKind } from "@/lib/db/assignments";
import { actionFail, formFail } from "@/lib/forms/fail";

/**
 * Author a new assignment from a master_catalog_items row + an assignee.
 * party_kind = 'user' (the platform path). crew_member and
 * external_holder paths exist in the schema and are created elsewhere
 * (crew roster + public ticket-sales flow).
 */
const Schema = z.object({
  catalog_item_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  party_user_id: z.string().uuid(),
  deadline: z.string().optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
  atom_id: z.string().uuid().optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createAssignmentAction(projectId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can assign catalog items" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) return { error: "Project not found" };

  const { data: member } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("org_id", session.orgId)
    .eq("user_id", parsed.data.party_user_id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!member) return { error: "Assignee is not in your organization" };

  // catalog_kind is set by the BEFORE INSERT trigger from
  // master_catalog_items.kind — we pass it on insert for the NOT NULL
  // constraint (trigger overwrites with the authoritative value).
  const { data: catalogItem } = await supabase
    .from("master_catalog_items")
    .select("id, kind")
    .eq("id", parsed.data.catalog_item_id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!catalogItem) return { error: "Catalog item not found in your organization" };

  if (parsed.data.atom_id) {
    const { data: atom } = await supabase
      .from("xpms_atoms")
      .select("id")
      .eq("id", parsed.data.atom_id)
      .eq("org_id", session.orgId)
      .maybeSingle();
    if (!atom) return { error: "Atom not found in your organization" };
  }

  const { data: created, error } = await supabase
    .from("assignments")
    .insert({
      org_id: session.orgId,
      project_id: projectId,
      catalog_item_id: parsed.data.catalog_item_id,
      catalog_kind: catalogItem.kind as CatalogKind,
      party_kind: "user",
      party_user_id: parsed.data.party_user_id,
      fulfillment_state: "briefed",
      title: parsed.data.title,
      notes: parsed.data.notes || null,
      atom_id: parsed.data.atom_id || null,
      deadline: parsed.data.deadline || null,
      created_by: session.userId,
    })
    .select("id, catalog_kind")
    .single();
  if (error) return actionFail(error.message, fd);
  const kind = (created as { catalog_kind: CatalogKind }).catalog_kind;

  void writeInbox({
    userId: parsed.data.party_user_id,
    orgId: session.orgId,
    kind: "assignment",
    sourceType: "assignments",
    sourceId: (created as { id: string }).id,
    actorId: session.userId,
    title: `New ${CATALOG_KIND_LABEL_SINGULAR[kind] ?? "assignment"} assigned`,
    body: parsed.data.title,
    href: "/m/advances",
  });

  revalidatePath(`/console/projects/${projectId}/advancing/assignments`);
  redirect(`/console/projects/${projectId}/advancing/assignments`);
}
