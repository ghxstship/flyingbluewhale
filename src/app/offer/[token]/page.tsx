import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { LetterDocument } from "@/components/offer-letters/LetterDocument";
import { Badge } from "@/components/ui/Badge";
import { hasSupabase } from "@/lib/env";
import { getOfferLetterByToken } from "@/lib/offer-letters/queries";
import { STATUS_LABEL, STATUS_VARIANT } from "@/lib/offer-letters/types";
import { getActiveMsaForCrew } from "@/lib/msa/queries";
import { msaPublicUrl } from "@/lib/msa/format";
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

  const activeMsa = await getActiveMsaForCrew(letter.crew_member_id);
  const msaSignerUrl = activeMsa ? msaPublicUrl(activeMsa.public_token) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Badge variant={STATUS_VARIANT[letter.status]}>{STATUS_LABEL[letter.status]}</Badge>
        <div className="flex items-center gap-3 text-xs">
          <a
            href={`/offer/${token}/print`}
            target="_blank"
            rel="noreferrer"
            className="rounded border border-[var(--border-default)] px-3 py-1.5 text-[var(--p-text-2)] hover:border-[var(--p-accent)] hover:text-[var(--p-accent)]"
          >
            Download PDF / Print
          </a>
          <span className="text-[var(--p-text-2)]">Reference · OL-{letter.id.slice(0, 8).toUpperCase()}</span>
        </div>
      </div>

      <LetterDocument letter={letter} activeMsa={activeMsa} msaSignerUrl={msaSignerUrl} />

      <ResponseForms token={token} status={letter.status} recipientName={letter.recipient_name} />
    </div>
  );
}
