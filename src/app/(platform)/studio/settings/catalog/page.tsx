import { redirect } from "next/navigation";
import { urlFor } from "@/lib/urls";

/**
 * Canonical home moved to the LEG3ND Organization Hub (decision 6 rider).
 * The URL stays alive as a redirect; the lens (?filter=pending) and view
 * (?view=gallery) params carry over so saved links keep their state.
 */
export default async function CatalogRedirect({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; filter?: string }>;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  if (sp.filter) qs.set("filter", sp.filter);
  if (sp.view) qs.set("view", sp.view);
  const suffix = qs.size > 0 ? `?${qs.toString()}` : "";
  redirect(urlFor("legend", `/hub/catalogs${suffix}`));
}
