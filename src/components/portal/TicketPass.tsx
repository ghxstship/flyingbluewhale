import QRCode from "qrcode";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getRequestT } from "@/lib/i18n/request";

/**
 * <TicketPass> — a scannable per-ticket pass for the portal guest surface.
 *
 * Server component: renders the assignment's ACTIVE scan code as a real QR
 * (data-URL generated server-side via the `qrcode` dependency — same pattern
 * as the accreditation print sheet), plus tier / seat / state chrome. The
 * QR field stays white in both themes so gate scanners read it reliably.
 *
 * Privacy: this component renders exactly one holder's ticket — callers are
 * responsible for scoping the query to the signed-in viewer (C-06).
 */

export type TicketPassData = {
  id: string;
  code: string | null;
  tierCode: string | null;
  seatSection: string | null;
  seatRow: string | null;
  seatNumber: string | null;
  state: string;
  issuedAt: string | null;
  eventName: string;
};

export async function TicketPass({ ticket }: { ticket: TicketPassData }) {
  const { t } = await getRequestT();
  const inactive = ["voided", "expired", "redeemed", "returned"].includes(ticket.state);
  const qr =
    ticket.code && !inactive
      ? await QRCode.toDataURL(ticket.code, { errorCorrectionLevel: "M", margin: 1, width: 480 })
      : null;
  const seat = [
    ticket.seatSection
      ? `${t("p.guest.tickets.pass.section", undefined, "Section")} ${ticket.seatSection}`
      : null,
    ticket.seatRow ? `${t("p.guest.tickets.pass.row", undefined, "Row")} ${ticket.seatRow}` : null,
    ticket.seatNumber ? `${t("p.guest.tickets.pass.seat", undefined, "Seat")} ${ticket.seatNumber}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="surface overflow-hidden p-0" aria-label={t("p.guest.tickets.pass.aria", undefined, "Ticket pass")}>
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
            {ticket.eventName}
          </div>
          <div className="mt-0.5 text-sm font-semibold">
            {ticket.tierCode ?? t("p.guest.tickets.pass.generalAdmission", undefined, "General Admission")}
          </div>
          {seat && <div className="mt-0.5 text-xs text-[var(--p-text-2)]">{seat}</div>}
        </div>
        <StatusBadge status={ticket.state} />
      </div>

      <div className="mt-3 flex flex-col items-center gap-2 border-t border-dashed border-[var(--p-border)] px-4 py-4">
        {qr ? (
          <>
            {/* Scanner field: fixed white so the QR reads in dark mode too. */}
            <div className="rounded-lg bg-white p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qr}
                alt={t("p.guest.tickets.pass.qrAlt", undefined, "Entry code, scan at the gate")}
                width={192}
                height={192}
                className="h-48 w-48"
              />
            </div>
            <div className="font-mono text-xs text-[var(--p-text-2)]">{ticket.code}</div>
            <p className="text-center text-[11px] text-[var(--p-text-2)]">
              {t("p.guest.tickets.pass.hint", undefined, "Show this at the gate. Turn your brightness up.")}
            </p>
          </>
        ) : (
          <p className="py-6 text-center text-xs text-[var(--p-text-2)]">
            {inactive
              ? t("p.guest.tickets.pass.inactive", undefined, "This pass is no longer scannable.")
              : t(
                  "p.guest.tickets.pass.noCode",
                  undefined,
                  "Your entry code isn't ready yet. It appears here as soon as the team issues it.",
                )}
          </p>
        )}
      </div>
    </article>
  );
}
