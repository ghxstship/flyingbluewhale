"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  origin: z.string().min(1),
  destination: z.string().min(1),
  miles: z.string().min(1),
  logged_on: z.string().date(),
  notes: z.string().optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createMileageAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const { error } = await supabase.from("mileage_logs").insert({
    org_id: session.orgId,
    user_id: session.userId,
    origin: parsed.data.origin,
    destination: parsed.data.destination,
    miles: Number(parsed.data.miles),
    logged_on: parsed.data.logged_on,
    notes: parsed.data.notes || null,
  });
  if (error) return actionFail(error.message, fd);
  revalidatePath("/studio/finance/mileage");
  redirect("/studio/finance/mileage");
}
