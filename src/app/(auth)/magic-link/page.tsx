import { MagicLinkForm } from "./MagicLinkForm";

import type { Metadata } from "next";
import { getRequestT } from "@/lib/i18n/request";

// E-14: every auth page carries its own title instead of the root default.
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return { title: t("auth.magicLink.pageTitle", undefined, "Magic Link Sign-In") };
}

export default function MagicLinkPage() {
  return <MagicLinkForm />;
}
