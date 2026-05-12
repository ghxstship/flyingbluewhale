"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const DigestSchema = z.enum(["immediate", "hourly", "daily"]);

export async function savePreferences(fd: FormData): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();

  const digest = DigestSchema.parse(fd.get("digest") ?? "immediate");

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
  await supabase
    .from("notification_preferences")
    .upsert(
      { user_id: session.userId, digest, matrix, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );

  revalidatePath("/m/settings/notifications");
  revalidatePath("/m/settings");
  redirect("/m/settings/notifications?saved=1");
}
