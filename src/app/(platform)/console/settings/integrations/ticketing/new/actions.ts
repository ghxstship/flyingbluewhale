"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdmin, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TICKETING_PROVIDERS } from "@/lib/marketplace";

const Schema = z.object({
  provider: z.enum(TICKETING_PROVIDERS),
  external_event_id: z.string().max(200).optional().or(z.literal("")),
  label: z.string().max(200).optional().or(z.literal("")),
  api_key: z.string().max(500).optional().or(z.literal("")),
});

export type State = { error?: string } | null;

export async function createTicketingConnectionAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  // Connecting a ticketing provider stores an upstream API key — must
  // stay owner/admin-only at the app layer (matches the
  // /console/settings/integrations install/uninstall gate).
  if (!isAdmin(session)) return { error: "Only owners and admins can connect ticketing providers" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ticketing_connections")
    .insert({
      org_id: session.orgId,
      provider: parsed.data.provider,
      external_event_id: parsed.data.external_event_id || null,
      label: parsed.data.label || null,
      api_credentials: parsed.data.api_key ? { token: parsed.data.api_key } : {},
      is_active: true,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/console/settings/integrations/ticketing");
  // Land on the new connection's detail page so the operator can record
  // a sales snapshot immediately.
  redirect(`/console/settings/integrations/ticketing/${(data as { id: string }).id}`);
}

export async function deactivateTicketingConnectionAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isAdmin(session)) return { error: "Only owners and admins can disconnect ticketing providers" };
  const id = String(fd.get("connection_id") ?? "");
  if (!id) return { error: "Missing connection" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("ticketing_connections")
    .update({ is_active: false })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath("/console/settings/integrations/ticketing");
  return null;
}
