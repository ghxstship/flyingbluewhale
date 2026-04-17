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
  const { error } = await supabase
    .from("tickets")
    .update({ status: "scanned", scanned_at: now, scanned_by: input.scannerUserId })
    .eq("id", ticket.id)
    .eq("status", "issued");
  if (error) return { result: "not_found" };

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
