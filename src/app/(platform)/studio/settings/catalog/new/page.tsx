import { redirect } from "next/navigation";
import { urlFor } from "@/lib/urls";

/**
 * Canonical home moved to the LEG3ND Organization Hub (decision 6 rider).
 * The single write path is /legend/hub/catalogs/new.
 */
export default function NewCatalogItemRedirect() {
  redirect(urlFor("legend", "/hub/catalogs/new"));
}
