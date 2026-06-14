"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { formFail } from "@/lib/forms/fail";

const Schema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().max(2000).optional().or(z.literal("")),
  duration_minutes: z.string().optional().or(z.literal("")),
  required_for_role: z.string().max(80).optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateCourseAction(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  // Editing course metadata is a content-authoring action — manager+ only.
  if (!isManagerPlus(session)) return { error: "Only manager+ can edit courses" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  const dur = parsed.data.duration_minutes ? Number(parsed.data.duration_minutes) : null;
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("courses", session.orgId, id, expectedUpdatedAt, {
    title: parsed.data.title,
    summary: parsed.data.summary || null,
    duration_minutes: Number.isFinite(dur as number) ? dur : null,
    required_for_role: parsed.data.required_for_role || null,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Course not found." };
  }
  revalidatePath(`/console/workforce/courses/${id}`);
  revalidatePath("/console/workforce/courses");
  redirect(`/console/workforce/courses/${id}`);
}
