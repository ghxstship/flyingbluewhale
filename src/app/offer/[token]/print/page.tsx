import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { getOfferLetterByToken } from "@/lib/offer-letters/queries";
import { getActiveMsaForCrew } from "@/lib/msa/queries";
import { msaPublicUrl } from "@/lib/msa/format";
import { LetterDocument } from "@/components/offer-letters/LetterDocument";
import { PRINT_PALETTE_CSS } from "@/lib/print/print-palette";
import { PrintTrigger } from "./PrintTrigger";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Engagement Letter · Print",
  robots: { index: false, follow: false },
};

/**
 * Bare-bones print view. The browser's "Save as PDF" / "Print" target
 * produces a clean single-document PDF. No nav chrome, no response forms,
 * no badge — just the letter.
 */
export default async function PrintPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!hasSupabase) notFound();
  const c = await cookies();
  const code = c.get(`offer_${token}`)?.value;
  if (!code) notFound();
  const letter = await getOfferLetterByToken(token, code);
  if (!letter || !letter.id) notFound();
  const activeMsa = await getActiveMsaForCrew(letter.crew_member_id);
  const msaSignerUrl = activeMsa ? msaPublicUrl(activeMsa.public_token) : null;
  const { t } = await getRequestT();

  return (
    <main className="min-h-screen bg-white text-black" data-theme="light">
      <style dangerouslySetInnerHTML={{ __html: PRINT_PALETTE_CSS }} />
      <div className="mx-auto max-w-[8in] py-8 print:py-0">
        <div className="no-print mb-6 flex items-center justify-between gap-3 rounded border border-black/20 bg-[var(--p-surface-2)] px-4 py-3 text-xs text-black">
          <div>
            {t("legal.offerPrint.instructionsBefore", undefined, "Click")}{" "}
            <strong>{t("legal.offerPrint.printSaveAsPdf", undefined, "Print / Save as PDF")}</strong>
            {t("legal.offerPrint.instructionsMiddle", undefined, ", then choose")}{" "}
            <em>{t("legal.offerPrint.saveAsPdf", undefined, "Save as PDF")}</em>{" "}
            {t("legal.offerPrint.instructionsAfter", undefined, "in your browser's print dialog.")}
          </div>
          <div className="flex items-center gap-3">
            <PrintTrigger />
            <a href={`/offer/${token}`} className="text-[var(--p-info)] hover:underline">
              {t("legal.offerPrint.backToLetter", undefined, "← Back to letter")}
            </a>
          </div>
        </div>
        <LetterDocument letter={letter} activeMsa={activeMsa} msaSignerUrl={msaSignerUrl} t={t} />
      </div>
    </main>
  );
}
