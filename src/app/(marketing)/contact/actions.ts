"use server";

import { z } from "zod";
import { sendEmail } from "@/lib/email";
import type { FormState } from "@/components/FormShell";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.string().email("Enter a valid email").max(254),
  company: z.string().max(120).optional(),
  scale: z.string().max(20).optional(),
  vertical: z.string().max(80).optional(),
  message: z.string().max(4000).optional(),
  demo: z.string().optional(),
});

export async function submitContact(_prev: FormState, fd: FormData): Promise<FormState> {
  const raw = {
    name: fd.get("name") ?? "",
    email: fd.get("email") ?? "",
    company: fd.get("company") ?? undefined,
    scale: fd.get("scale") ?? undefined,
    vertical: fd.get("vertical") ?? undefined,
    message: fd.get("message") ?? undefined,
    demo: fd.get("demo") ?? undefined,
  };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as string;
      fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const { name, email, company, scale, vertical, message, demo } = parsed.data;
  const wantsDemo = demo === "on";

  const lines = [
    `Name: ${name}`,
    `Email: ${email}`,
    company ? `Company: ${company}` : null,
    scale ? `Scale: ${scale} productions/year` : null,
    vertical ? `Vertical: ${vertical}` : null,
    message ? `\nMessage:\n${message}` : null,
    wantsDemo ? "\n[Requested a live walkthrough]" : null,
  ]
    .filter(Boolean)
    .join("\n");

  const result = await sendEmail({
    to: "sales@lytehaus.live",
    subject: `Studio inquiry — ${name}${company ? ` @ ${company}` : ""}`,
    text: lines,
    replyTo: email,
  });

  if (!result.ok) {
    return { error: "Message delivery failed — please try emailing sales@lytehaus.live directly." };
  }

  return { ok: true };
}
