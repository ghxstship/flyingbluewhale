import QRCode from "qrcode";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  person_name: string;
  card_barcode: string | null;
  category: { code: string; name: string } | null;
  delegation: { code: string | null; name: string | null } | null;
  valid_to: string | null;
};

/**
 * Multi-up batch badge sheet for approved accreditations.
 * Two columns × N rows, sized for ID-1 cards (85.6mm × 54mm).
 * Operator hits ⌘P → tray-loaded blank PVC cards.
 */
export default async function PrintSheetPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title="Print Sheet" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("accreditations")
    .select(
      "id, person_name, card_barcode, valid_to, category:category_id(code, name), delegation:delegation_id(code, name)",
    )
    .eq("org_id", session.orgId)
    .eq("state", "approved")
    .order("person_name")
    .limit(200);
  const rows = (data ?? []) as unknown as Row[];

  // Pre-render QR codes server-side so the print stays clean (no flash of
  // empty cards) and operators can save the page as a PDF if they prefer.
  const cards = await Promise.all(
    rows.map(async (r) => ({
      ...r,
      qrDataUrl: r.card_barcode ? await QRCode.toDataURL(r.card_barcode, { margin: 0, width: 160 }) : null,
    })),
  );

  return (
    <>
      <ModuleHeader
        eyebrow="Accreditation · Print"
        title="Badge Sheet"
        subtitle={`${cards.length} card${cards.length === 1 ? "" : "s"} · ⌘P to print`}
        action={
          <div className="flex items-center gap-2 print:hidden">
            <Button href="/console/accreditation/print" variant="ghost" size="sm">
              Back
            </Button>
          </div>
        }
      />
      <div className="page-content">
        <div className="grid grid-cols-2 gap-4 print:gap-2">
          {cards.length === 0 ? (
            <div className="surface col-span-2 p-6 text-sm text-[var(--text-muted)]">No approved badges queued.</div>
          ) : (
            cards.map((c) => (
              <div
                key={c.id}
                className="relative overflow-hidden rounded-lg border-2 border-[var(--border-color)] bg-white p-4 text-black print:break-inside-avoid"
                style={{ aspectRatio: "85.6 / 54" }}
              >
                <div className="flex h-full flex-col">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[8px] font-semibold tracking-[0.2em] text-black/60 uppercase">
                        {c.delegation?.code ?? c.delegation?.name ?? "Org"}
                      </div>
                      <div className="mt-1 text-base leading-tight font-bold">{c.person_name}</div>
                      {c.category && (
                        <div className="mt-1 inline-block rounded bg-black px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase">
                          {c.category.code}
                        </div>
                      )}
                    </div>
                    {c.qrDataUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.qrDataUrl} alt="" aria-hidden="true" className="h-16 w-16" />
                    )}
                  </div>
                  <div className="mt-auto flex items-end justify-between text-[8px] text-black/60">
                    <span className="font-mono">{c.card_barcode ?? c.id.slice(0, 12)}</span>
                    {c.valid_to && (
                      <span>
                        Valid to <span className="font-mono">{c.valid_to.slice(0, 10)}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
