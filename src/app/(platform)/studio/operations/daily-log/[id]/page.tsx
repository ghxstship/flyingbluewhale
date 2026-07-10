import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { ConversationPanel } from "@/components/ConversationPanel";
import { Presence } from "@/components/collab/Presence";
import { getPresenceUser } from "@/components/collab/getPresenceUser";
import { ActivityDrawer } from "@/components/collab/activity";
import { getActivityForRecord } from "@/lib/db/activity";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/server";
import {
  deleteDailyLogPhoto,
  transitionDailyLog,
  uploadDailyLogPhoto,
  toggleDailyLogSignoff,
} from "./actions";
import { DAILY_LOG_SECTIONS } from "./sections";
import { StatusForm } from "@/components/StatusForm";
import { Button } from "@/components/ui/Button";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { toneFor } from "@/lib/tones";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const { t } = await getRequestT();
  const fmtDate = (d: string): string =>
    fmt.dateParts(d + "T00:00:00", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  const { data: log } = await supabase
    .from("daily_logs")
    .select("*, project:project_id(name)")
    .eq("org_id", session.orgId)
    .eq("id", id)
    .maybeSingle();
  if (!log) notFound();
  const presenceUser = await getPresenceUser(session);
  const activity = await getActivityForRecord({
    orgId: session.orgId,
    targetTable: "daily_logs",
    targetId: id,
    limit: 50,
  });

  const [{ data: manpower }, { data: equipment }, { data: deliveries }, { data: visitors }, { data: photosData }] =
    await Promise.all([
      supabase.from("daily_log_manpower").select("*").eq("daily_log_id", id).order("trade"),
      supabase.from("daily_log_equipment").select("*").eq("daily_log_id", id),
      supabase.from("daily_log_deliveries").select("*").eq("daily_log_id", id).order("arrived_at"),
      supabase.from("daily_log_visitors").select("*").eq("daily_log_id", id).order("arrived_at"),
      supabase
        .from("daily_log_photos")
        .select("id, file_path, caption, taken_at, taken_by")
        .eq("daily_log_id", id)
        .eq("org_id", session.orgId)
        .order("taken_at", { ascending: false }),
    ]);

  // Photos were orphaned in the schema — no surface lets a foreman add
  // or view them, so site documentation has been living in side-channel
  // tools (Slack, text msgs) instead of the audit-trailed log. Render
  // them with short-lived signed URLs (procore-parity bucket is
  // private; signed URLs scope per-request and expire on their own).
  type PhotoRow = {
    id: string;
    file_path: string;
    caption: string | null;
    taken_at: string;
    taken_by: string | null;
  };
  const photos = (photosData ?? []) as PhotoRow[];
  // Signed-URL minting needs the storage admin (service) client. Degrade
  // gracefully: if storage/config is unavailable, render the log without
  // download links rather than failing the entire detail page.
  let signedPhotos: Array<PhotoRow & { signed_url: string | null }> = photos.map((p) => ({
    ...p,
    signed_url: null,
  }));
  try {
    const service = createServiceClient();
    signedPhotos = await Promise.all(
      photos.map(async (p) => {
        const { data: signed } = await service.storage.from("procore-parity").createSignedUrl(p.file_path, 600);
        return { ...p, signed_url: signed?.signedUrl ?? null };
      }),
    );
  } catch {
    // storage/config unavailable — links omitted, page still renders.
  }
  const photosEditable = log.log_state !== "approved";

  const totalHeadcount = (manpower ?? []).reduce((s, m) => s + (m.headcount ?? 0), 0);
  const totalHours = (manpower ?? []).reduce((s, m) => s + Number(m.hours_worked ?? 0), 0);
  const projectName = (log.project as unknown as { name: string | null } | null)?.name ?? "—";

  // Section sign-off (kit 21 R3) — one row per signed section; the header
  // shows sections-signed completeness (Raken).
  const { data: signoffData } = await supabase
    .from("daily_log_signoffs")
    .select("section")
    .eq("org_id", session.orgId)
    .eq("daily_log_id", id);
  const signedSections = new Set(((signoffData ?? []) as Array<{ section: string }>).map((s) => s.section));
  const signedCount = DAILY_LOG_SECTIONS.filter((s) => signedSections.has(s)).length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.operations.dailyLog.detail.eyebrow", undefined, "Operations")}
        breadcrumbs={[
          {
            label: t("console.operations.dailyLog.detail.breadcrumb", undefined, "Daily Log"),
            href: "/studio/operations/daily-log",
          },
          { label: fmtDate(log.log_date) },
        ]}
        title={fmtDate(log.log_date)}
        subtitle={projectName}
        action={
          <div className="flex items-center gap-2">
            <Presence targetTable="daily_logs" targetId={id} currentUser={presenceUser} />
            <Badge variant={signedCount === DAILY_LOG_SECTIONS.length ? "success" : "muted"}>
              {t(
                "console.operations.dailyLog.detail.signedTally",
                { signed: signedCount, total: DAILY_LOG_SECTIONS.length },
                `${signedCount}/${DAILY_LOG_SECTIONS.length} Signed`,
              )}
            </Badge>
            <Badge variant={toneFor(log.log_state)}>{toTitle(log.log_state)}</Badge>
            {log.log_state === "draft" && (
              <StatusForm
                action={transitionDailyLog.bind(null, id, "submitted")}
                label={t("common.submit", undefined, "Submit")}
              />
            )}
            {log.log_state === "submitted" && (
              <StatusForm
                action={transitionDailyLog.bind(null, id, "approved")}
                label={t("common.approve", undefined, "Approve")}
              />
            )}
          </div>
        }
      />
      <div className="page-content space-y-5">
        <section className="grid gap-4 md:grid-cols-3">
          <div className="surface p-4">
            <div className="text-xs font-semibold tracking-wide text-[var(--p-text-2)] uppercase">
              {t("console.operations.dailyLog.detail.weather", undefined, "Weather")}
            </div>
            <p className="mt-2 text-sm">{log.weather_summary ?? "—"}</p>
            {(log.weather_temp_high_f != null || log.weather_temp_low_f != null) && (
              <p className="mt-1 text-xs text-[var(--p-text-2)]">
                {t(
                  "console.operations.dailyLog.detail.tempRange",
                  { high: log.weather_temp_high_f ?? "—", low: log.weather_temp_low_f ?? "—" },
                  `${log.weather_temp_high_f ?? "—"}°F high / ${log.weather_temp_low_f ?? "—"}°F low`,
                )}
              </p>
            )}
          </div>
          <div className="surface p-4">
            <div className="text-xs font-semibold tracking-wide text-[var(--p-text-2)] uppercase">
              {t("console.operations.dailyLog.detail.manpower", undefined, "Manpower")}
            </div>
            <p className="mt-2 text-2xl font-semibold">{totalHeadcount}</p>
            <p className="text-xs text-[var(--p-text-2)]">
              {t(
                "console.operations.dailyLog.detail.manpowerSummary",
                { hours: totalHours.toFixed(1), trades: (manpower ?? []).length },
                `${totalHours.toFixed(1)} hrs across ${(manpower ?? []).length} trades`,
              )}
            </p>
          </div>
          <div className="surface p-4">
            <div className="text-xs font-semibold tracking-wide text-[var(--p-text-2)] uppercase">
              {t("console.operations.dailyLog.detail.activity", undefined, "Activity")}
            </div>
            <p className="mt-2 text-sm">
              {t(
                "console.operations.dailyLog.detail.activitySummary",
                {
                  deliveries: (deliveries ?? []).length,
                  visitors: (visitors ?? []).length,
                  equipment: (equipment ?? []).length,
                },
                `${(deliveries ?? []).length} deliveries · ${(visitors ?? []).length} visitors · ${(equipment ?? []).length} equipment entries`,
              )}
            </p>
          </div>
        </section>

        {log.notes && (
          <section className="surface p-4">
            <h3 className="text-sm font-semibold">
              {t("console.operations.dailyLog.detail.siteNarrative", undefined, "Site Narrative")}
            </h3>
            <p className="mt-2 text-sm whitespace-pre-wrap">{log.notes}</p>
          </section>
        )}

        <section className="surface p-4">
          <h3 className="text-sm font-semibold">
            {t("console.operations.dailyLog.detail.manpower", undefined, "Manpower")}
          </h3>
          {(manpower ?? []).length === 0 ? (
            <p className="mt-2 text-xs text-[var(--p-text-2)]">
              {t("console.operations.dailyLog.detail.noManpower", undefined, "No manpower entries.")}
            </p>
          ) : (
            <table className="ps-table mt-3">
              <thead>
                <tr>
                  <th>{t("console.operations.dailyLog.detail.trade", undefined, "Trade")}</th>
                  <th>{t("console.operations.dailyLog.detail.headcount", undefined, "Headcount")}</th>
                  <th>{t("console.operations.dailyLog.detail.hours", undefined, "Hours")}</th>
                  <th>{t("console.operations.dailyLog.detail.notes", undefined, "Notes")}</th>
                </tr>
              </thead>
              <tbody>
                {(manpower ?? []).map((m) => (
                  <tr key={m.id}>
                    <td>{m.trade}</td>
                    <td className="font-mono text-xs">{m.headcount}</td>
                    <td className="font-mono text-xs">{Number(m.hours_worked).toFixed(1)}</td>
                    <td>{m.notes ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="surface p-4">
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-semibold">
              {t("console.operations.dailyLog.detail.photos", undefined, "Photos")}
            </h3>
            <span className="font-mono text-xs text-[var(--p-text-2)]">
              {photos.length === 1
                ? t(
                    "console.operations.dailyLog.detail.photoCountOne",
                    { count: photos.length },
                    `${photos.length} photo`,
                  )
                : t(
                    "console.operations.dailyLog.detail.photoCountOther",
                    { count: photos.length },
                    `${photos.length} photos`,
                  )}
            </span>
          </div>
          {photos.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--p-text-2)]">
              {t(
                "console.operations.dailyLog.detail.noPhotos",
                undefined,
                "No site photos attached. Upload below. Captioned photos land in the audit trail with the log.",
              )}
            </p>
          ) : (
            <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {signedPhotos.map((p) => (
                <li key={p.id} className="surface-inset overflow-hidden rounded-md">
                  {p.signed_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={p.signed_url}
                      alt={
                        p.caption ?? t("console.operations.dailyLog.detail.photoAlt", undefined, "Daily log site photo")
                      }
                      className="aspect-video w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="aspect-video w-full bg-[var(--p-surface)] text-center text-xs leading-[14rem] text-[var(--p-text-2)]">
                      {t("console.operations.dailyLog.detail.previewUnavailable", undefined, "Preview unavailable")}
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2 p-2 text-xs">
                    <div>
                      {p.caption && <div className="font-medium">{p.caption}</div>}
                      <div className="font-mono text-[11px] text-[var(--p-text-2)]">{fmt.dateTime(p.taken_at)}</div>
                    </div>
                    {photosEditable && (
                      <form action={deleteDailyLogPhoto}>
                        <input type="hidden" name="dailyLogId" value={id} />
                        <input type="hidden" name="photoId" value={p.id} />
                        <Button type="submit" size="sm" variant="ghost">
                          {t("common.remove", undefined, "Remove")}
                        </Button>
                      </form>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {photosEditable && (
            <form
              action={uploadDailyLogPhoto}
              encType="multipart/form-data"
              className="surface-inset mt-4 grid grid-cols-1 gap-2 rounded-md p-3 sm:grid-cols-4"
            >
              <input type="hidden" name="dailyLogId" value={id} />
              <input
                name="file"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
                required
                className="ps-input sm:col-span-2"
              />
              <input
                name="caption"
                placeholder={t(
                  "console.operations.dailyLog.detail.captionPlaceholder",
                  undefined,
                  "Caption · Optional",
                )}
                maxLength={280}
                className="ps-input sm:col-span-1"
              />
              <Button type="submit" size="sm" variant="secondary" className="sm:col-span-1">
                {t("common.upload", undefined, "Upload")}
              </Button>
            </form>
          )}
          {!photosEditable && (
            <p className="mt-3 text-xs text-[var(--p-text-2)]">
              {t(
                "console.operations.dailyLog.detail.photosLocked",
                undefined,
                "Photos are locked once the log is approved.",
              )}
            </p>
          )}
        </section>

        <section className="surface p-4">
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-semibold">
              {t("console.operations.dailyLog.detail.signOff", undefined, "Sign-Off")}
            </h3>
            <span className="font-mono text-xs text-[var(--p-text-2)]">
              {t(
                "console.operations.dailyLog.detail.signedTally",
                { signed: signedCount, total: DAILY_LOG_SECTIONS.length },
                `${signedCount}/${DAILY_LOG_SECTIONS.length} Signed`,
              )}
            </span>
          </div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {DAILY_LOG_SECTIONS.map((sec) => {
              const signed = signedSections.has(sec);
              return (
                <li
                  key={sec}
                  className="flex items-center justify-between gap-2 rounded-[var(--p-r-md)] border border-[var(--p-border)] px-3 py-2"
                >
                  <span className="text-sm capitalize">{sec}</span>
                  <form action={toggleDailyLogSignoff.bind(null, id, sec)}>
                    <button
                      type="submit"
                      className={`ps-btn ps-btn--sm ${signed ? "ps-btn--secondary" : "ps-btn--cta"}`}
                    >
                      {signed
                        ? t("console.operations.dailyLog.detail.signed", undefined, "Signed")
                        : t("console.operations.dailyLog.detail.sign", undefined, "Sign")}
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <ConversationPanel orgId={session.orgId} recordType="daily_log" recordId={id} />
          <ActivityDrawer targetTable="daily_logs" targetId={id} initial={activity} />
        </div>
      </div>
    </>
  );
}
