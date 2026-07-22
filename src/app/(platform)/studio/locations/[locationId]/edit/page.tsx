import { redirect } from "next/navigation";
import { urlFor } from "@/lib/urls";

/**
 * Canonical home moved to the LEG3ND Organization Hub (decision 6 rider).
 * Deep links to the location editor land on the hub editor.
 */
export default async function EditLocationRedirect({ params }: { params: Promise<{ locationId: string }> }) {
  const { locationId } = await params;
  redirect(urlFor("legend", `/hub/locations/${locationId}/edit`));
}
