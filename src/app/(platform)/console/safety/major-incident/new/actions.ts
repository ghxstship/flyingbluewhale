"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  name: z.string().min(1).max(200),
  incident_state: z.string().max(40).optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createMajorIncident(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("major_incidents")
    .insert({
      org_id: session.orgId,
      name: parsed.data.name,
      incident_state: parsed.data.incident_state || "activated",
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);
  revalidatePath("/console/safety/major-incident");
  redirect(`/console/safety/major-incident/${data.id}`);
}
