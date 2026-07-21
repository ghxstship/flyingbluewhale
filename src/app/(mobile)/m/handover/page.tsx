import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { Fab, KIcon } from "@/components/mobile/kit";
import { signPhotoRefsFor } from "@/lib/mobile/photo-sign";
import { HandoverListView, type HandoverItem } from "./HandoverListView";

export const dynamic = "force-dynamic";

/** Must match the bucket `submitHandover` uploads to. */
const HANDOVER_PHOTO_BUCKET = "procore-parity";

/**
 * COMPVSS · Shift Handover — end-of-shift report passing status, open items and
 * assets to the next crew. Reads the dedicated 3NF `handovers` table
 * (org-scoped, newest first) and links to the new-handover form.
 *
 * Kit 34 view engine: the org-wide list now renders through NormalizedList
 * (list/table/board). The board groups by `post_state`; `post_state` is
 * status so it is never the quick-filter pill (pill = the handover author).
 */
type HandoverRow = {
  id: string;
  from_user_id: string | null;
  to_user_id: string | null;
  relief_label: string | null;
  post_state: string;
  summary: string;
  open_items: string | null;
  assets_passed: string | null;
  photos: unknown;
  created_at: string;
};

export default async function HandoverPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("handovers")
    .select(
      "id, from_user_id, to_user_id, relief_label, post_state, summary, open_items, assets_passed, photos, created_at",
    )
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(60);
  const handovers = (data ?? []) as HandoverRow[];

  // Sign every handover's photos (the state of the post you're being handed is
  // the thing the next crew most needs to SEE, not read) and resolve who handed
  // off each report in one round trip — both depend only on the handover rows.
  const userIds = Array.from(new Set(handovers.map((h) => h.from_user_id).filter(Boolean) as string[]));
  const [photosById, usersRes] = await Promise.all([
    signPhotoRefsFor(supabase, HANDOVER_PHOTO_BUCKET, handovers, (h) => h.photos),
    userIds.length ? supabase.from("users").select("id, name, email").in("id", userIds) : null,
  ]);
  const nameMap = new Map<string, string>();
  for (const u of (usersRes?.data ?? []) as Array<{ id: string; name: string | null; email: string | null }>) {
    nameMap.set(u.id, u.name ?? u.email ?? "");
  }

  // Flatten to the client view's shape — signed photos + resolved author name +
  // preformatted date threaded in (the client can't reach storage or the DB).
  const items: HandoverItem[] = handovers.map((h) => ({
    id: h.id,
    summary: h.summary,
    post_state: h.post_state,
    authorName: h.from_user_id ? nameMap.get(h.from_user_id) ?? null : null,
    reliefLabel: h.relief_label,
    openItems: h.open_items,
    assetsPassed: h.assets_passed,
    createdLabel: `${fmt.date(h.created_at)} · ${fmt.time(h.created_at)}`,
    photos: photosById.get(h.id) ?? [],
  }));

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.handover.eyebrow", undefined, "Shift")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.handover.title", undefined, "Handover")}
      </h1>

      <Link
        href="/m/handover/new"
        className="ps-btn ps-btn--cta ps-btn--lg"
        style={{ width: "100%", justifyContent: "center", marginBottom: 16 }}
      >
        <KIcon name="Repeat" size={16} /> {t("m.handover.new", undefined, "New Handover")}
      </Link>

      <HandoverListView items={items} />

      {/* Kit-29 spec: FAB = New Handover (FormScreen). */}
      <Fab href="/m/handover/new" label={t("m.handover.newCta", undefined, "New Handover")} />
    </div>
  );
}
