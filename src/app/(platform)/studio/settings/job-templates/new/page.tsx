import { redirect } from "next/navigation";
import { urlFor } from "@/lib/urls";

/**
 * Canonical home moved to the LEG3ND Organization Hub (decision 6 rider).
 * The single write path is /legend/hub/templates/job-templates/new.
 */
export default function NewJobTemplateRedirect() {
  redirect(urlFor("legend", "/hub/templates/job-templates/new"));
}
