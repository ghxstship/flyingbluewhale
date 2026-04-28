"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  person_name: z.string().min(1).max(160),
  nationality: z.string().max(80).optional(),
  passport_no: z.string().max(60).optional(),
  status: z.string().max(40).optional(),
});

export type State = { error?: string } | null;

export async function createVisaCase(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("visa_cases")
    .insert({
      org_id: session.orgId,
      person_name: parsed.data.person_name,
      nationality: parsed.data.nationality || null,
      passport_no: parsed.data.passport_no || null,
      status: parsed.data.status || "open",
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/console/participants/visa");
  redirect(`/console/participants/visa/${data.id}`);
}
