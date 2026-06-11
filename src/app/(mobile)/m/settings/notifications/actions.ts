"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const DigestSchema = z.enum(["immediate", "hourly", "daily"]);

export type State = { error?: string } | null;

export async function savePreferences(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const supabase = await createClient();

  const parsedDigest = DigestSchema.safeParse(fd.get("digest") ?? "immediate");
  if (!parsedDigest.success) return { error: parsedDigest.error.issues[0]?.message ?? "Invalid input" };
  const digest = parsedDigest.data;

  // Read the canonical kind list — anything not in the catalog is
  // ignored. Trust the wire as little as possible.
  const { data: kinds } = await supabase.from("notification_kind_catalog").select("kind");
  const valid = new Set(((kinds ?? []) as Array<{ kind: string }>).map((k) => k.kind));

  const matrix: Record<string, { push: boolean; email: boolean }> = {};
  for (const k of valid) {
    matrix[k] = {
      push: fd.get(`push_${k}`) === "on",
      email: fd.get(`email_${k}`) === "on",
    };
  }

  // Upsert by user_id — table PK is user_id.
  const { error } = await supabase
    .from("notification_preferences")
    .upsert(
      { user_id: session.userId, digest, matrix, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
  if (error) return { error: `Could not save preferences: ${error.message}` };

  revalidatePath("/m/settings/notifications");
  revalidatePath("/m/settings");
  redirect("/m/settings/notifications?saved=1");
}
