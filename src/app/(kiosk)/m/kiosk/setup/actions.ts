"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { emitAudit } from "@/lib/audit";
import { isManagerPlus, requireSession } from "@/lib/auth";
import {
  KIOSK_DEVICE_COOKIE,
  KIOSK_DEVICE_COOKIE_MAX_AGE_S,
  generateDeviceToken,
  hashDeviceToken,
} from "@/lib/kiosk/device-token";
import { log } from "@/lib/log";
import { createClient } from "@/lib/supabase/server";

export type State = { error?: string } | null;

/**
 * Register THIS tablet as a kiosk device — runs under the MANAGER's own
 * session (the registration authority), then plants the device-token cookie
 * that outlives that session. The raw token exists only in the cookie; the
 * DB stores its SHA-256. RLS (manager band) is the write gate.
 */
export async function registerKioskDevice(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only managers can register a kiosk device." };

  const label = String(fd.get("label") ?? "").trim();
  if (!label) return { error: "Give the device a name (e.g. “Load-In Gate iPad”)." };
  if (label.length > 80) return { error: "Device name is too long (80 characters max)." };
  const projectRaw = String(fd.get("project_id") ?? "").trim();
  const projectId = projectRaw || null;

  const rawToken = generateDeviceToken();
  const supabase = await createClient();
  const { data: device, error } = await supabase
    .from("kiosk_devices")
    .insert({
      org_id: session.orgId,
      project_id: projectId,
      label,
      registered_by: session.userId,
      device_token_hash: hashDeviceToken(rawToken),
    })
    .select("id")
    .maybeSingle();
  if (error || !device) {
    log.error("kiosk.device.register_failed", { err: error?.message });
    return { error: error?.message ?? "Could not register the device." };
  }

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "kiosk.device.registered",
    targetTable: "kiosk_devices",
    targetId: device.id as string,
    metadata: { label, project_id: projectId },
  });

  const jar = await cookies();
  jar.set(KIOSK_DEVICE_COOKIE, rawToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: KIOSK_DEVICE_COOKIE_MAX_AGE_S,
  });

  redirect("/m/kiosk");
}

/**
 * Revoke a device registration. The tablet's cookie becomes a dead token on
 * the next request — there is no grace period, that's the point.
 */
export async function deactivateKioskDevice(deviceId: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;

  const supabase = await createClient();
  // Read the row back — a silent RLS no-op UPDATE returns no error, and a
  // revocation the operator believes happened but didn't is a security hole.
  const { data: updated, error } = await supabase
    .from("kiosk_devices")
    .update({ active: false })
    .eq("id", deviceId)
    .eq("org_id", session.orgId)
    .select("id")
    .maybeSingle();
  if (error || !updated) {
    log.error("kiosk.device.deactivate_failed", { device_id: deviceId, err: error?.message ?? "no_row" });
    return;
  }

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "kiosk.device.deactivated",
    targetTable: "kiosk_devices",
    targetId: deviceId,
  });

  revalidatePath("/m/kiosk/setup");
}
