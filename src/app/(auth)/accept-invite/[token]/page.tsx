import { AcceptInviteForm } from "./AcceptInviteForm";

import type { Metadata } from "next";
import { getRequestT } from "@/lib/i18n/request";

// E-14: every auth page carries its own title instead of the root default.
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return { title: t("auth.acceptInvite.pageTitle", undefined, "Accept Invite") };
}

export default async function AcceptInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <AcceptInviteForm token={token} />;
}
