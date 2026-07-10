import { notFound } from "next/navigation";
import QRCode from "qrcode";
import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import type { Asset } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

/**
 * Printable QR sticker for a single asset record. The QR encodes the asset
 * id directly so /m/inventory/scan can resolve it on the same scanner
 * pipeline that already handles tickets.
 *
 * One-up sheet sized for a 3x3 inch label; Cmd-P from the operator.
 */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = (await getOrgScoped("assets", session.orgId, id)) as Asset | null;
  if (!row) notFound();
  const { t } = await getRequestT();

  const name = row.display_name;
  const assetTag = row.asset_tag;
  const serial = row.serial;

  const dataUrl = await QRCode.toDataURL(id, { margin: 1, width: 480 });

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.assets.qr.eyebrow", undefined, "Asset · QR sticker")}
        title={name}
        action={
          <div className="flex items-center gap-2 print:hidden">
            <Button href={`/studio/assets/${id}`} variant="ghost" size="sm">
              {t("common.back", undefined, "Back")}
            </Button>
            <Link href={dataUrl} download={`asset-${assetTag ?? id}.png`} className="ps-btn ps-btn--ghost ps-btn--sm">
              {t("console.assets.qr.downloadPng", undefined, "Download PNG")}
            </Link>
            <span className="text-xs text-[var(--p-text-2)]">
              {t("console.assets.qr.printHint", undefined, "⌘P to print")}
            </span>
          </div>
        }
      />
      <div className="page-content">
        <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-lg border-2 border-dashed border-[var(--p-border)] bg-white p-6 print:border-0 print:p-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dataUrl}
            alt={t("console.assets.qr.qrAlt", { name }, `QR code for ${name}`)}
            className="h-72 w-72"
          />
          <div className="text-center">
            <div className="text-base font-semibold text-black">{name}</div>
            {assetTag && (
              <div className="font-mono text-xs text-black/70">
                {t("console.assets.qr.assetLabel", { assetTag }, `Asset: ${assetTag}`)}
              </div>
            )}
            {serial && (
              <div className="font-mono text-[11px] text-black/60">
                {t("console.assets.qr.serialLabel", { serial }, `SN: ${serial}`)}
              </div>
            )}
            <div className="mt-1 font-mono text-[11px] text-black/40">{id.slice(0, 8)}…</div>
          </div>
        </div>
        <p className="mx-auto mt-4 max-w-md text-center text-xs text-[var(--p-text-2)] print:hidden">
          {t(
            "console.assets.qr.scanHint",
            undefined,
            "Scan with /m/inventory/scan to look up the asset, log a movement, or check status.",
          )}
        </p>
      </div>
    </>
  );
}
