"use server";

import { revalidatePath } from "next/cache";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { urlFor } from "@/lib/urls";
import { formatDateParts } from "@/lib/i18n/format";
import { advanceInviteEmail, type AdvanceChecklistLine } from "@/components/email/templates";
import { advanceSubject, buildMergeContext, renderMergeString } from "@/lib/advancing/merge";
import {
  applyRecipientDelivery,
  setBatchState,
  type AdvanceBatchState,
  type AdvanceContact,
} from "@/lib/db/advance-packets";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { actionErrorMessage } from "@/lib/errors";

function boardPath(batchId: string): string {
  return `/studio/comms/advances/${batchId}`;
}

type BatchContext = {
  batch: { id: string; subject: string | null; batch_state: AdvanceBatchState; packet_id: string };
  packet: {
    id: string;
    voice: string;
    support_contact: { name?: string; email?: string };
    project: { name: string; slug: string };
  };
};

async function guardBatch(batchId: string): Promise<
  | { error: string }
  | ({ orgId: string; userId: string; supabase: Awaited<ReturnType<typeof createClient>> } & BatchContext)
> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.operate-advance-sends", "Only manager+ can operate advance sends") };
  const supabase = await createClient();
  const { data } = await supabase
    .from("advance_send_batches")
    .select("id, subject, batch_state, packet_id, advance_packets(id, voice, support_contact, projects(name, slug))")
    .eq("id", batchId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) return { error: actionErrorMessage("not-found.batch", "Batch not found") };
  const rawPacket = data.advance_packets as unknown as {
    id: string;
    voice: string;
    support_contact: { name?: string; email?: string } | null;
    projects: { name: string; slug: string } | null;
  } | null;
  if (!rawPacket?.projects) return { error: actionErrorMessage("batch-packet-is-missing-its-project", "Batch packet is missing its project") };
  return {
    orgId: session.orgId,
    userId: session.userId,
    supabase,
    batch: {
      id: data.id,
      subject: data.subject,
      batch_state: data.batch_state as AdvanceBatchState,
      packet_id: data.packet_id,
    },
    packet: {
      id: rawPacket.id,
      voice: rawPacket.voice,
      support_contact: rawPacket.support_contact ?? {},
      project: rawPacket.projects,
    },
  };
}

type RecipientRow = {
  id: string;
  audience_id: string | null;
  contact: AdvanceContact;
  delivery_state: string;
  portal_token: string;
};

type AudienceRow = {
  id: string;
  company: string;
  team: string | null;
  contract_id: string | null;
};

async function renderForRecipient(
  ctx: Extract<Awaited<ReturnType<typeof guardBatch>>, { orgId: string }>,
  recipient: RecipientRow,
  audience: AudienceRow | undefined,
): Promise<{ subject: string; html: string; merge: Record<string, string> }> {
  const { supabase, packet, batch } = ctx;
  const checklist: AdvanceChecklistLine[] = [];
  let deadlineLabel: string | null = null;
  if (audience) {
    const { data: assignments } = await supabase
      .from("advance_section_assignments")
      .select("requirement, due_at, advance_packet_sections(title)")
      .eq("audience_id", audience.id)
      .neq("requirement", "hidden")
      .is("deleted_at", null)
      .limit(100);
    for (const a of (assignments ?? []) as Array<{
      requirement: "required" | "optional";
      due_at: string | null;
      advance_packet_sections: { title: string } | null;
    }>) {
      const dueLabel = a.due_at
        ? formatDateParts(
            a.due_at,
            { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" },
            { timezone: "UTC" },
          )
        : undefined;
      checklist.push({
        label: a.advance_packet_sections?.title ?? "Section",
        requirement: a.requirement,
        dueLabel,
      });
      if (a.requirement === "required" && a.due_at && (!deadlineLabel || a.due_at < deadlineLabel)) {
        deadlineLabel = dueLabel ?? null;
      }
    }
  }

  const projectName = packet.project.name;
  const projectCode = projectName.replace(/\s+/g, "");
  const portalUrl = urlFor("portal", `/${packet.project.slug}/advancing?t=${recipient.portal_token}`);
  const merge = buildMergeContext({
    projectName,
    projectCode,
    team: audience?.team,
    company: audience?.company ?? "Team",
    recipientName: recipient.contact?.name,
    contractId: audience?.contract_id,
    deadline: deadlineLabel,
    portalUrl,
    supportOwner: packet.support_contact?.name ?? packet.support_contact?.email,
  });
  const subject = batch.subject
    ? renderMergeString(batch.subject, merge)
    : advanceSubject({
        projectCode,
        team: audience?.team,
        company: audience?.company ?? "Team",
        voice: packet.voice,
      });
  const rendered = advanceInviteEmail({
    recipientName: recipient.contact?.name,
    projectCode,
    projectName,
    team: audience?.team,
    company: audience?.company ?? "Team",
    voice: packet.voice,
    contractId: audience?.contract_id,
    checklist,
    deadlineLabel,
    portalUrl,
    supportOwner: packet.support_contact?.name,
  });
  return { subject, html: rendered.html, merge };
}

async function loadRecipients(
  supabase: Awaited<ReturnType<typeof createClient>>,
  batchId: string,
): Promise<{ recipients: RecipientRow[]; audiences: Map<string, AudienceRow> }> {
  const { data: recipients } = await supabase
    .from("advance_send_recipients")
    .select("id, audience_id, contact, delivery_state, portal_token")
    .eq("batch_id", batchId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(500);
  const rows = (recipients ?? []) as unknown as RecipientRow[];
  const audienceIds = Array.from(new Set(rows.map((r) => r.audience_id).filter(Boolean))) as string[];
  const audiences = new Map<string, AudienceRow>();
  if (audienceIds.length > 0) {
    const { data } = await supabase
      .from("advance_audiences")
      .select("id, company, team, contract_id")
      .in("id", audienceIds)
      .is("deleted_at", null);
    for (const a of (data ?? []) as AudienceRow[]) audiences.set(a.id, a);
  }
  return { recipients: rows, audiences };
}

/** S5 · Send — one personalized render per queued recipient. */
export async function sendBatchAction(batchId: string): Promise<void> {
  const ctx = await guardBatch(batchId);
  if ("error" in ctx) return;
  const from = ctx.batch.batch_state;
  if (!["draft", "scheduled", "failed"].includes(from)) return;

  const moved = await setBatchState(batchId, from, "sending", ctx.userId);
  if (!moved) return;

  const { recipients, audiences } = await loadRecipients(ctx.supabase, batchId);
  const queued = recipients.filter((r) => r.delivery_state === "queued");
  let delivered = 0;
  let failed = 0;
  let skipped = 0;
  for (const recipient of queued) {
    const email = recipient.contact?.email;
    if (!email) {
      failed += 1;
      continue;
    }
    try {
      const audience = recipient.audience_id ? audiences.get(recipient.audience_id) : undefined;
      const { subject, html, merge } = await renderForRecipient(ctx, recipient, audience);
      const result = await sendEmail({ to: email, subject, html });
      if (!result.ok) {
        failed += 1;
        await applyRecipientDelivery(ctx.supabase as unknown as LooseSupabase, recipient.id, "bounced", {
          userId: ctx.userId,
          reason: result.error ?? "send failed",
        });
        continue;
      }
      // Freeze what this recipient actually received (S4 audit trail).
      await ctx.supabase
        .from("advance_send_recipients")
        .update({ render_snapshot: { subject, merge, skipped: result.skipped ?? false, resend_id: result.id ?? null } })
        .eq("id", recipient.id)
        .eq("org_id", ctx.orgId);
      if (result.skipped) {
        // No provider key — nothing left the building. The recipient STAYS
        // queued so the funnel never shows delivered mail that was never
        // sent, and a re-send after the key lands picks them up again.
        skipped += 1;
        continue;
      }
      await applyRecipientDelivery(ctx.supabase as unknown as LooseSupabase, recipient.id, "delivered", {
        userId: ctx.userId,
        reason: "invite sent",
      });
      delivered += 1;
    } catch {
      failed += 1;
    }
  }

  // Skipped-only runs land failed (not sent): the batch can be re-sent once
  // the provider key exists, and the board never claims a send that didn't
  // happen.
  const finalState: AdvanceBatchState = delivered > 0 || queued.length === 0 ? "sent" : "failed";
  const note =
    skipped > 0
      ? `${delivered} delivered, ${failed} failed, ${skipped} skipped (no email provider key)`
      : `${delivered} delivered, ${failed} failed`;
  await setBatchState(batchId, "sending", finalState, ctx.userId, note);
  revalidatePath(boardPath(batchId));
  revalidatePath("/studio/comms/advances");
}

/** S4 · Preview — test send the first recipient's render to yourself. */
export async function testSendAction(batchId: string): Promise<void> {
  const ctx = await guardBatch(batchId);
  if ("error" in ctx) return;
  const { recipients, audiences } = await loadRecipients(ctx.supabase, batchId);
  const first = recipients[0];
  if (!first) return;
  const { data: me } = await ctx.supabase
    .from("users")
    .select("email")
    .eq("id", ctx.userId)
    // soft-delete-exempt: resolving the caller's own email for a test send
    .maybeSingle();
  const email = (me as { email?: string } | null)?.email;
  if (!email) return;
  const audience = first.audience_id ? audiences.get(first.audience_id) : undefined;
  const { subject, html } = await renderForRecipient(ctx, first, audience);
  await sendEmail({ to: email, subject: `[Test] ${subject}`, html });
  revalidatePath(boardPath(batchId));
}

/** S6 · Track — operator closes the loop on a fully-confirmed recipient. */
export async function completeRecipientAction(batchId: string, fd: FormData): Promise<void> {
  const ctx = await guardBatch(batchId);
  if ("error" in ctx) return;
  const recipientId = String(fd.get("recipient_id") ?? "");
  if (!recipientId) return;
  await applyRecipientDelivery(ctx.supabase as unknown as LooseSupabase, recipientId, "complete", {
    userId: ctx.userId,
    reason: "confirmed by operator",
  });
  revalidatePath(boardPath(batchId));
}
