import { redirect } from "next/navigation";
import { urlFor } from "@/lib/urls";

/**
 * Canonical home moved to the LEG3ND Organization Hub (decision 6 rider).
 * Deep links to the catalog-item editor land on the hub editor.
 */
export default async function EditCatalogItemRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(urlFor("legend", `/hub/catalogs/${id}/edit`));
}
