import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { ContractView } from "./ContractView";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ offerId: string }> }) {
  const { offerId } = await params;
  if (!hasSupabase) return notFound();

  const session = await requireSession();
  const supabase = await createClient();

  const { data: offer } = await supabase
    .from("talent_offers")
    .select("id, fee_cents, currency, deposit_pct, performance_date, status")
    .eq("id", offerId)
    .eq("org_id", session.orgId)
    .maybeSingle();

  if (!offer) return notFound();

  const { data: contract } = await supabase
    .from("offer_contracts")
    .select("id, rendered_markdown, status, sent_at, signed_by_org_at, signed_by_talent_at")
    .eq("offer_id", offerId)
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: templates } = await supabase
    .from("contract_templates")
    .select("id, name, is_default")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("is_default", { ascending: false })
    .order("name");

  return (
    <>
      <ModuleHeader
        eyebrow="Marketplace · Offer"
        title="Contract"
        actions={
          <Button href={`/console/marketplace/offers/${offerId}`} variant="ghost">
            ← Back to offer
          </Button>
        }
      />
      <div className="page-content max-w-3xl">
        <ContractView
          offerId={offerId}
          contract={contract}
          templates={(templates ?? []) as Array<{ id: string; name: string; is_default: boolean }>}
        />
      </div>
    </>
  );
}
