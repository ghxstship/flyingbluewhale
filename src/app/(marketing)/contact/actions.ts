"use server";

import { z } from "zod";
import { sendEmail } from "@/lib/email";

const ContactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  company: z.string().max(200).optional(),
  scale: z.string().max(20).optional(),
  vertical: z.string().max(100).optional(),
  message: z.string().max(4000).optional(),
  demo: z.string().optional(),
});

export type ContactState = { error?: string; success?: true } | null;

export async function submitContact(
  _prev: ContactState,
  data: FormData,
): Promise<ContactState> {
  const raw = {
    name: data.get("name"),
    email: data.get("email"),
    company: data.get("company"),
    scale: data.get("scale"),
    vertical: data.get("vertical"),
    message: data.get("message"),
    demo: data.get("demo"),
  };

  const parsed = ContactSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Please check the form and try again." };
  }

  const { name, email, company, scale, vertical, message, demo } = parsed.data;
  const wantsDemo = demo === "on";

  const html = `
<p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
${company ? `<p><strong>Company:</strong> ${company}</p>` : ""}
${scale ? `<p><strong>Productions/year:</strong> ${scale}</p>` : ""}
${vertical ? `<p><strong>Vertical:</strong> ${vertical}</p>` : ""}
${message ? `<p><strong>Message:</strong></p><p>${message.replace(/\n/g, "<br>")}</p>` : ""}
${wantsDemo ? `<p><strong>Requested live walkthrough: Yes</strong></p>` : ""}
`.trim();

  const result = await sendEmail({
    to: "sales@flytehaus.live",
    subject: `Studio inquiry${wantsDemo ? " (walkthrough requested)" : ""} — ${name}`,
    html,
    replyTo: email,
  });

  if (!result.ok) {
    return { error: "Couldn't send your message. Please email sales@flytehaus.live directly." };
  }

  return { success: true };
}
