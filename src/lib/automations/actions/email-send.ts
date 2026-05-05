import { z } from "zod";
import { registerAction } from "../registry";
import { sendEmail } from "@/lib/email";

const Schema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email()).min(1)]),
  subject: z.string().min(1).max(300),
  /** HTML body. Either `body` or `text` must be provided. */
  body: z.string().max(50000).optional(),
  /** Plain-text fallback. */
  text: z.string().max(50000).optional(),
  replyTo: z.string().email().optional(),
});

registerAction({
  type: "email.send",
  schema: Schema,
  label: "Send Email",
  description: "Sends a transactional email via Resend.",
  async run(input, _ctx) {
    if (!input.body && !input.text) {
      throw new Error("email.send requires `body` (HTML) or `text` (plain).");
    }
    const result = await sendEmail({
      to: input.to,
      subject: input.subject,
      html: input.body,
      text: input.text,
      replyTo: input.replyTo,
    });
    if (!result.ok) {
      throw new Error(result.error ?? "email send failed");
    }
    return { output: { sent: true, providerId: result.id ?? null } };
  },
});

export {};
