import { redirect } from "next/navigation";
import { urlFor } from "@/lib/urls";

/**
 * Canonical home moved to the LEG3ND Organization Hub (decision 6 rider).
 * The space registry's read/write surface is /legend/hub/locations; this
 * URL stays alive as a redirect. The picker demo at ./picker is a developer
 * reference for the async Combobox, not a locations surface, and stays.
 */
export default function LocationsRedirect() {
  redirect(urlFor("legend", "/hub/locations"));
}
