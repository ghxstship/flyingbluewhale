import "server-only";
import { env, hasResend } from "./env";

export type EmailPayload = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
};

/**
 * Send a transactional email via Resend. No-op when RESEND_API_KEY is absent
 * (dev + preview-only deploys). Swap for a queue-backed sender once volume warrants.
 */
export async function sendEmail(payload: EmailPayload): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!hasResend) {
    console.info("[email noop]", payload.subject, payload.to);
    return { ok: true };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: env.RESEND_FROM ?? "flyingbluewhale <no-reply@flyingbluewhale.app>",
      to: Array.isArray(payload.to) ? payload.to : [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      reply_to: payload.replyTo,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    return { ok: false, error: `resend ${res.status}: ${body}` };
  }
  const data = (await res.json()) as { id?: string };
  return { ok: true, id: data.id };
}

// Convenience: send a proposal share-link notification.
export async function sendProposalShareEmail({
  to,
  proposalTitle,
  url,
  senderName,
}: { to: string; proposalTitle: string; url: string; senderName?: string }) {
  return sendEmail({
    to,
    subject: `${senderName ?? "flyingbluewhale"} sent you a proposal: ${proposalTitle}`,
    html: `
      <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
        <p style="color:#666;font-size:12px;letter-spacing:.15em;text-transform:uppercase">Proposal</p>
        <h1 style="font-family:'Cormorant Garamond',serif;font-size:32px;margin:12px 0 8px">${proposalTitle}</h1>
        <p style="color:#444;font-size:14px">${senderName ?? "The team"} shared a proposal with you.</p>
        <p><a href="${url}" style="display:inline-block;background:#0a0a0a;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px">Open proposal</a></p>
        <p style="color:#999;font-size:12px;margin-top:24px">If the button doesn't work, copy this URL:<br/><code>${url}</code></p>
      </div>`,
  });
}
