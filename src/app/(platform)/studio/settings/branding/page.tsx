import { redirect } from "next/navigation";
import { urlFor } from "@/lib/urls";

/**
 * Canonical home moved to the LEG3ND Organization Hub (decision 6 rider).
 * The URL stays alive as a redirect so bookmarks, nav entries, and deep
 * links keep working; the single write path is /legend/hub/brand.
 */
export default function BrandingRedirect() {
  redirect(urlFor("legend", "/hub/brand"));
}
