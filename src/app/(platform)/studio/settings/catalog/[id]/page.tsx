import { redirect } from "next/navigation";
import { urlFor } from "@/lib/urls";

/**
 * Canonical home moved to the LEG3ND Organization Hub (decision 6 rider).
 * Deep links to a catalog item land on the hub detail.
 */
export default async function CatalogItemRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(urlFor("legend", `/hub/catalogs/${id}`));
}
