import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /p/[slug]/messages/start — mint a chat_room for an
 * account_manager_assignments row that doesn't yet have one. The
 * caller must be the portal_user_id on the assignment; we create the
 * room as `direct`, add both users as members, and redirect to the
 * portal chat surface — /p/[slug]/messages/[roomId] — which handles
 * message posting + realtime without leaving the portal shell.
 */

const Schema = z.object({ assignment_id: z.string().uuid() });

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await requireSession();
  const form = await req.formData();
  const parsed = Schema.safeParse({ assignment_id: form.get("assignment_id") });
  if (!parsed.success) return new NextResponse("Bad request", { status: 400 });
  const supabase = await createClient();

  const { data: assignment } = await supabase
    .from("account_manager_assignments")
    .select("id, org_id, portal_user_id, manager_user_id, chat_room_id, persona")
    .eq("id", parsed.data.assignment_id)
    .maybeSingle();
  if (!assignment) return new NextResponse("Not found", { status: 404 });
  const a = assignment as {
    id: string;
    org_id: string;
    portal_user_id: string;
    manager_user_id: string;
    chat_room_id: string | null;
    persona: string;
  };
  if (a.portal_user_id !== session.userId) return new NextResponse("Forbidden", { status: 403 });

  // Idempotent: if the room exists, jump straight to it.
  if (a.chat_room_id) {
    return NextResponse.redirect(new URL(`/p/${slug}/messages/${a.chat_room_id}`, req.url), 303);
  }

  // Create the direct-message room scoped to the assignment's org.
  const { data: room, error: roomErr } = await supabase
    .from("chat_rooms")
    .insert({
      org_id: a.org_id,
      room_kind: "direct",
      name: `AM · ${a.persona}`,
      created_by: session.userId,
      last_message_at: null,
    })
    .select("id")
    .single();
  if (roomErr || !room) return new NextResponse("Insert failed", { status: 500 });

  // Add both members. Portal user is the default `member`; AM is `admin`
  // so they can rename the room if they want.
  await supabase.from("chat_room_members").insert([
    { room_id: room.id, user_id: a.portal_user_id, member_role: "member" },
    { room_id: room.id, user_id: a.manager_user_id, member_role: "admin" },
  ]);

  // Backfill the assignment with the room id so the next visit
  // short-circuits the create path.
  await supabase.from("account_manager_assignments").update({ chat_room_id: room.id }).eq("id", a.id);

  return NextResponse.redirect(new URL(`/p/${slug}/messages/${room.id}`, req.url), 303);
}
