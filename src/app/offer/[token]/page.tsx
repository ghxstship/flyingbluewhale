import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { LetterDocument } from "@/components/offer-letters/LetterDocument";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getOfferLetterByToken } from "@/lib/offer-letters/queries";
import { STATUS_LABEL, STATUS_VARIANT } from "@/lib/offer-letters/types";
import { UnlockForm } from "./UnlockForm";
import { ResponseForms } from "./ResponseForms";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!hasSupabase) notFound();

  const c = await cookies();
  const code = c.get(`offer_${token}`)?.value;

  if (!code) {
    return <UnlockForm token={token} />;
  }

  const letter = await getOfferLetterByToken(token, code);
  if (!letter || !letter.id) {
    return <UnlockForm token={token} expired />;
  }

  let projectLabel = "Project TBD";
  if (letter.project_id) {
    const supabase = await createClient();
    const { data: name } = await supabase.rpc("get_offer_letter_project_name", {
      p_token: token,
      p_code: code,
    });
    if (name) projectLabel = name as unknown as string;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Badge variant={STATUS_VARIANT[letter.status]}>{STATUS_LABEL[letter.status]}</Badge>
        <span className="text-xs text-[var(--text-muted)]">Reference · OL-{letter.id.slice(0, 8).toUpperCase()}</span>
      </div>

      <LetterDocument letter={letter} projectLabel={projectLabel} />

      <ResponseForms token={token} status={letter.status} recipientName={letter.recipient_name} />
    </div>
  );
}
