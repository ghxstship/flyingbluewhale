"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { projectIdFromSlug } from "@/lib/db/advancing";
import type { FormState } from "@/components/FormShell";

/**
 * C-13 — in-app accreditation application from the portal.
 *
 * Inserts an `accreditations` row in state `applied` / vetting `pending` —
 * exactly what the operator console's accreditation queue reads. The insert
 * RLS band on `accreditations` is manager+, so a portal applicant's write
 * goes through the service client after strict validation: session required,
 * the slug's project must belong to the caller's org, and the category must
 * be one of that org's published categories. The row is always stamped with
 * the caller's user_id so their own applications list (RLS: user_id = uid)
 * shows it immediately.
 */

const Schema = z.object({
  slug: z.string().min(1),
  personName: z.string().trim().min(1).max(160),
  categoryId: z.string().uuid(),
  note: z.string().trim().max(1000).optional(),
});

export async function submitAccreditationApplication(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await requireSession();
  const parsed = Schema.safeParse({
    slug: fd.get("slug"),
    personName: fd.get("personName"),
    categoryId: fd.get("categoryId"),
    note: fd.get("note") ?? "",
  });
  if (!parsed.success) {
    return { error: "Check the highlighted fields and try again." };
  }
  const { slug, personName, categoryId, note } = parsed.data;

  const project = await projectIdFromSlug(slug);
  if (!project) return { error: "This portal's project could not be found." };
  if (project.org_id !== session.orgId) {
    return { error: "Your account isn't linked to this event's organization yet. Use the email option instead." };
  }

  // Category must be one of this org's published categories — never trust
  // the posted id. The service client (when configured) also lets applicants
  // whose read band can't see categories still submit against a valid one;
  // without a service key we fall back to the caller's RLS client, where the
  // insert succeeds only for manager-band callers.
  const db = isServiceClientAvailable() ? createServiceClient() : await createClient();
  const { data: category } = await db
    .from("accreditation_categories")
    .select("id, name")
    .eq("id", categoryId)
    .eq("org_id", project.org_id)
    .maybeSingle();
  if (!category) return { error: "Pick a category from the list." };

  const insert = {
    org_id: project.org_id,
    person_name: personName,
    person_email: session.email || null,
    user_id: session.userId,
    category_id: category.id,
    state: "applied" as const,
    vetting: "pending" as const,
    metadata: { source: "portal_apply", slug, note: note || null },
  };

  const { error } = await db.from("accreditations").insert(insert);
  if (error) {
    return {
      error: "We couldn't file your application. Try again, or email the accreditation team below.",
    };
  }

  revalidatePath(`/p/${slug}/apply`);
  return { ok: true };
}
