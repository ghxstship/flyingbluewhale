import "server-only";
import { createClient } from "@/lib/supabase/server";

export type ScanResult =
  | { result: "accepted"; ticketId: string; holderName: string | null; tier: string }
  | { result: "duplicate"; ticketId: string; scannedAt: string }
  | { result: "voided"; ticketId: string }
  | { result: "not_found" };

export async function scanTicket(input: {
  orgId: string;
  scannerUserId: string;
  code: string;
  location?: { lat: number; lng: number; accuracy?: number };
}): Promise<ScanResult> {
  const supabase = await createClient();

  const { data: ticket } = await supabase
    .from("tickets")
    .select("id,status,holder_name,tier,scanned_at")
    .eq("org_id", input.orgId)
    .eq("code", input.code)
    .maybeSingle();

  if (!ticket) {
    return { result: "not_found" };
  }
  if (ticket.status === "voided") {
    return { result: "voided", ticketId: ticket.id };
  }
  if (ticket.status === "scanned") {
    return { result: "duplicate", ticketId: ticket.id, scannedAt: ticket.scanned_at ?? new Date().toISOString() };
  }

  const now = new Date().toISOString();
  // Conditional update: only mark scanned if the row is still `issued`. If
  // two scanners race on the same ticket, one wins (rows=1) and the other
  // sees rows=0. The .select("id,scanned_at") tells us which case we're in
  // — without it we'd have no way to distinguish "I scanned it" from
  // "someone else scanned it 50ms ago", and would double-record both as
  // accepted in ticket_scans + return both as the winning scan.
  const { data: claimed, error } = await supabase
    .from("tickets")
    .update({ status: "scanned", scanned_at: now, scanned_by: input.scannerUserId })
    .eq("id", ticket.id)
    .eq("org_id", input.orgId)
    .eq("status", "issued")
    .select("id,scanned_at");
  if (error) return { result: "not_found" };

  // Lost the race — another scanner already claimed this ticket between
  // our read above and our conditional update. Re-fetch to get the
  // canonical scanned_at + return duplicate so the user sees the
  // correct timestamp from the winning scan.
  if (!claimed || claimed.length === 0) {
    const { data: latest } = await supabase
      .from("tickets")
      .select("scanned_at")
      .eq("id", ticket.id)
      .eq("org_id", input.orgId)
      .maybeSingle();
    return {
      result: "duplicate",
      ticketId: ticket.id,
      scannedAt: latest?.scanned_at ?? now,
    };
  }

  // ticket_scans has no org_id column — its RLS policy walks up to
  // tickets.org_id via the FK. Don't add the field here.
  await supabase.from("ticket_scans").insert({
    ticket_id: ticket.id,
    scanner_id: input.scannerUserId,
    location: input.location ?? null,
    result: "accepted",
  });

  return {
    result: "accepted",
    ticketId: ticket.id,
    holderName: ticket.holder_name,
    tier: ticket.tier,
  };
}
