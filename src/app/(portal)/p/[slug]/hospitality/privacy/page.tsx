import { PortalPrivacyPanel } from "@/components/portal/PortalPrivacyPanel";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PortalPrivacyPanel persona="hospitality" slug={slug} />;
}
