import { redirect } from "next/navigation";
import { urlFor } from "@/lib/urls";

/**
 * Canonical home moved to the LEG3ND Organization Hub (decision 6 rider).
 * Deep links to a location land on the hub detail.
 */
export default async function LocationRedirect({ params }: { params: Promise<{ locationId: string }> }) {
  const { locationId } = await params;
  redirect(urlFor("legend", `/hub/locations/${locationId}`));
}
