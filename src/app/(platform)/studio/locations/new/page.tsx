import { redirect } from "next/navigation";
import { urlFor } from "@/lib/urls";

/**
 * Canonical home moved to the LEG3ND Organization Hub (decision 6 rider).
 * The single write path is /legend/hub/locations/new.
 */
export default function NewLocationRedirect() {
  redirect(urlFor("legend", "/hub/locations/new"));
}
