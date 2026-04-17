"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  name: z.string().min(1).max(120),
  contact_email: z.string().email().optional().or(z.literal("")),
  contact_phone: z.string().optional().or(z.literal("")),
  category: z.string().optional().or(z.literal("")),
  coi_expires_at: z.string().date().optional().or(z.literal("")),
  w9: z.string().optional(),
});

export type State = { error?: string } | null;

export async function createVendorAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid" };
  const supabase = await createClient();
  const { error } = await supabase.from("vendors").insert({
    org_id: session.orgId,
    name: parsed.data.name,
    contact_email: parsed.data.contact_email || null,
    contact_phone: parsed.data.contact_phone || null,
    category: parsed.data.category || null,
    coi_expires_at: parsed.data.coi_expires_at || null,
    w9_on_file: parsed.data.w9 === "on",
  });
  if (error) return { error: error.message };
  revalidatePath("/console/procurement/vendors");
  redirect("/console/procurement/vendors");
}
