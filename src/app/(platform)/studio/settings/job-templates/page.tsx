import { redirect } from "next/navigation";
import { urlFor } from "@/lib/urls";

/**
 * Canonical home moved to the LEG3ND Organization Hub (decision 6 rider).
 * Job templates live at /legend/hub/templates/job-templates; this URL stays
 * alive as a redirect.
 */
export default function JobTemplatesRedirect() {
  redirect(urlFor("legend", "/hub/templates/job-templates"));
}
