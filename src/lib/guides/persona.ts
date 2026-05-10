import type { GuidePersona, Persona } from "@/lib/supabase/types";

/**
 * Map a session persona to the corresponding guide tier.
 *
 * Granular marketplace personas (client, contractor, crew) get their own guide
 * tier so each sees the guide content authored for their role. Bug #13 /
 * Workstream A1 — previously collapsed all roles to staff/guest binary.
 */
export function mapSessionToGuidePersona(persona: Persona): GuidePersona {
  switch (persona) {
    case "owner":
    case "admin":
    case "manager":
    case "collaborator":
      return "staff";
    case "contractor":
      return "vendor";
    case "client":
      return "client";
    case "crew":
      return "crew";
    case "viewer":
    case "community":
    case "member":
    case "guest":
    case "visitor":
    default:
      return "guest";
  }
}
