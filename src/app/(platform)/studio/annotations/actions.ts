"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import {
  acknowledgeAnnotation,
  resolveAnnotation,
  dismissAnnotation,
  confirmAnnotation,
  replyToAnnotation,
} from "@/lib/db/annotations";

export type ActionResult = { error?: string } | undefined;

export async function acknowledgeAction(id: string): Promise<ActionResult> {
  const session = await requireSession();
  try {
    await acknowledgeAnnotation(id, session.orgId);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/studio/annotations");
  revalidatePath(`/studio/annotations/${id}`);
}

export async function resolveAction(id: string, note?: string): Promise<ActionResult> {
  const session = await requireSession();
  try {
    await resolveAnnotation(id, session.orgId, session.userId, note);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/studio/annotations");
  revalidatePath(`/studio/annotations/${id}`);
}

export async function dismissAction(id: string, note?: string): Promise<ActionResult> {
  const session = await requireSession();
  try {
    await dismissAnnotation(id, session.orgId, session.userId, note);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/studio/annotations");
  revalidatePath(`/studio/annotations/${id}`);
}

export async function confirmAction(id: string): Promise<ActionResult> {
  const session = await requireSession();
  try {
    await confirmAnnotation(id, session.orgId, session.userId);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/studio/annotations");
  revalidatePath(`/studio/annotations/${id}`);
}

export async function replyAction(parentId: string, body: string): Promise<ActionResult> {
  const session = await requireSession();
  if (!body.trim()) return { error: "Reply body is required." };
  try {
    await replyToAnnotation({ parentId, orgId: session.orgId, body, createdBy: session.userId });
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath(`/studio/annotations/${parentId}`);
}
