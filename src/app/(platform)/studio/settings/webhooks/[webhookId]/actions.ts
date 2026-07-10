"use server";

import { revalidatePath } from "next/cache";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { sendTestEvent, redeliverLast } from "@/lib/webhooks/deliver";
import { emitAudit } from "@/lib/audit";

export type DeliveryActionState = {
  ok: boolean;
  message: string;
} | null;

function describe(result: { ok: boolean; status: number | null; error: string | null }): DeliveryActionState {
  if (result.ok) return { ok: true, message: `Delivered (HTTP ${result.status})` };
  return { ok: false, message: result.error ?? "Delivery failed" };
}

export async function sendTestEventAction(
  _prev: DeliveryActionState,
  formData: FormData,
): Promise<DeliveryActionState> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { ok: false, message: "Manager role or above required" };
  const endpointId = String(formData.get("endpointId") ?? "");
  if (!endpointId) return { ok: false, message: "Missing endpoint id" };
  const result = await sendTestEvent(session.orgId, endpointId);
  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "webhook.test_sent",
    targetTable: "webhook_endpoints",
    targetId: endpointId,
    metadata: { ok: result.ok, status: result.status, error: result.error },
  });
  revalidatePath(`/studio/settings/webhooks/${endpointId}`);
  return describe(result);
}

export async function redeliverLastAction(
  _prev: DeliveryActionState,
  formData: FormData,
): Promise<DeliveryActionState> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { ok: false, message: "Manager role or above required" };
  const endpointId = String(formData.get("endpointId") ?? "");
  if (!endpointId) return { ok: false, message: "Missing endpoint id" };
  const result = await redeliverLast(session.orgId, endpointId);
  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "webhook.redelivered",
    targetTable: "webhook_endpoints",
    targetId: endpointId,
    metadata: { event: result.eventType, ok: result.ok, status: result.status, error: result.error },
  });
  revalidatePath(`/studio/settings/webhooks/${endpointId}`);
  return describe(result);
}
