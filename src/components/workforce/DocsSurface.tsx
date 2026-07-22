import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { MobileListRow } from "@/components/mobile/MobileListRow";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { DocDownloadLink } from "@/app/(mobile)/m/documents/DocDownloadLink";
import type { PortalHref } from "./shell-contract";

/**
 * Shared personal documents surface (ADR-0008 Move 1, Amendment 4).
 *
 * Same query + render across COMPVSS (`/m/docs`) and the portal
 * crew/vendor personas. DocDownloadLink is reused from the mobile module —
 * it's a small client island that hits the
 * `/api/v1/me/documents/[id]/download` signed-URL endpoint, shared
 * across shells regardless of where it's mounted.
 *
 * `uploadHref` is a `PortalHref` on the portal arm. Upload reads like a
 * camera flow, but the form carries no `capture` attribute — it's an OS file
 * picker, which every desktop has — so it is not capability-bound and the
 * portal owns its own upload form.
 */

type Doc = {
  id: string;
  label: string;
  doc_kind: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_at: string;
};

const KIND_TONE: Record<string, "info" | "success" | "warning" | "muted"> = {
  id: "info",
  license: "success",
  tax: "warning",
  contract: "info",
  medical: "warning",
  other: "muted",
};

type DocsProps = {
  eyebrowLabel?: string;
  titleLabel?: string;
} & ({ variant: "mobile"; uploadHref: string } | { variant: "portal"; uploadHref: PortalHref });

export async function DocsSurface({ variant, uploadHref, eyebrowLabel, titleLabel }: DocsProps) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="px-4 pt-6 pb-24 text-sm text-[var(--p-text-2)]">
        {t("common.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data: docs } = await supabase
    .from("personal_documents")
    .select("id, label, doc_kind, mime_type, size_bytes, uploaded_at")
    .eq("user_id", session.userId)
    .is("deleted_at", null)
    .order("uploaded_at", { ascending: false });

  const list = (docs ?? []) as Doc[];

  const containerClass = variant === "mobile" ? "px-4 pt-6 pb-24" : "page-content";
  const eyebrow = eyebrowLabel ?? (variant === "mobile" ? t("m.docs.eyebrow", undefined, "Mobile") : "Crew");
  const title = titleLabel ?? t("m.docs.title", undefined, "My Documents");

  return (
    <div className={containerClass}>
      <div className="text-xs font-semibold tracking-wider text-[var(--p-accent)] uppercase">{eyebrow}</div>
      <h1 className="mt-1 text-[length:var(--p-fs-h2)]">{title}</h1>
      <p className="mt-1 text-xs text-[var(--p-text-2)]">
        {t(
          "m.docs.subtitle",
          undefined,
          "Personal IDs, licenses, tax forms, and signed contracts. Only you can see these.",
        )}
      </p>

      <div className="mt-4 flex justify-end">
        <Link href={uploadHref} className="ps-btn ps-btn--sm">
          {t("m.docs.uploadCta", undefined, "+ Upload")}
        </Link>
      </div>

      <ul className="mt-5 space-y-2">
        {list.length === 0 ? (
          <li>
            <EmptyState
              size="compact"
              title={t("m.docs.empty.title", undefined, "No Documents")}
              description={t(
                "m.docs.empty.description",
                undefined,
                "Uploads from onboarding and contract signing land here.",
              )}
            />
          </li>
        ) : (
          list.map((d) => (
            <li key={d.id}>
              <MobileListRow
                title={d.label}
                meta={
                  <span className="inline-flex items-center gap-2">
                    <Badge variant={KIND_TONE[d.doc_kind] ?? "muted"}>{d.doc_kind}</Badge>
                    {d.mime_type && <span className="font-mono text-[11px]">{d.mime_type}</span>}
                  </span>
                }
                trailing={<span className="font-mono text-xs text-[var(--p-text-2)]">{fmt.date(d.uploaded_at)}</span>}
              >
                <div className="flex justify-end">
                  <DocDownloadLink docId={d.id} />
                </div>
              </MobileListRow>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
