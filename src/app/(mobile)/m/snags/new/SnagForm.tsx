"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { FolderOpen } from "lucide-react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { EmptyState } from "@/components/ui/EmptyState";
import { appendTranscriptToTextarea, DictationButton, KIcon } from "@/components/mobile/kit";
import { ATTACH_PARAM, takeStagedCapture, type StagedCapture } from "@/lib/mobile/capture-handoff";
import { raiseSnag, type State } from "../actions";

export type ProjectOpt = { id: string; name: string };

/**
 * COMPVSS · Raise A Snag — photo-first capture into the console punch-list
 * store. The photo input is FIRST and REQUIRED: the point of a field snag
 * report is that the person is standing in front of the defect with a
 * camera. `capture="environment"` opens the rear camera directly on device.
 *
 * No kit FormScreen spec exists for snags (the kit is SSOT — inventing one
 * would be a conformance violation), so this is the native-form idiom of
 * /m/daily-log/new.
 */
export function SnagForm({ projects }: { projects: ProjectOpt[] }) {
  const router = useRouter();
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<State>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  // T1-5 capture handoff — `?photo=<ref>` pre-attaches the shot taken on the
  // Capture screen. A native file input can't be pre-filled, so the staged
  // File rides component state and is appended at submit when the input is
  // still empty (picking a fresh photo always wins).
  const [staged, setStaged] = useState<StagedCapture | null>(null);
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get(ATTACH_PARAM);
    if (!ref) return;
    void takeStagedCapture(ref).then((s) => {
      if (s) setStaged(s);
    });
  }, []);

  function onSubmit(fd: FormData) {
    if (pending) return;
    setState(null);
    const picked = fd.get("photo");
    if (staged && !(picked instanceof File && picked.size > 0)) {
      fd.set("photo", staged.file);
    }
    startTransition(async () => {
      const res = await raiseSnag(null, fd);
      if (res?.error) {
        setState(res);
        return;
      }
      router.push("/m/snags");
      router.refresh();
    });
  }

  const fieldError = (k: string) => state?.fieldErrors?.[k];

  return (
    <div className="screen screen-anim">
      <button type="button" className="backbtn" onClick={() => router.back()}>
        <KIcon name="ChevronLeft" size={17} /> {t("m.snags.back", undefined, "Snags")}
      </button>
      <div className="scr-eye">{t("m.snags.new.eyebrow", undefined, "Site")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.snags.new.title", undefined, "Raise A Snag")}
      </h1>

      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderOpen size={28} aria-hidden="true" />}
          title={t("m.snags.new.noProjects", undefined, "No Projects")}
          description={t("m.snags.new.noProjectsBody", undefined, "Snags attach to a project. Ask Ops to add one.")}
        />
      ) : (
        <form action={onSubmit}>
          {/* Photo first, on purpose — see the component docblock. */}
          <div className="fld">
            <label htmlFor="snag-photo">
              {t("m.snags.new.photo", undefined, "Photo Of The Snag")}
              <span className="req"> *</span>
            </label>
            <input
              id="snag-photo"
              type="file"
              name="photo"
              accept="image/*"
              capture="environment"
              required={!staged}
              onChange={(e) => setPhotoName(e.target.files?.[0]?.name ?? null)}
              style={{ paddingTop: 11, paddingBottom: 11 }}
            />
            <div className="hint">
              {photoName
                ? t("m.snags.new.photoPicked", { name: photoName }, `Attached: ${photoName}`)
                : staged
                  ? t("m.capture.attachedFromCapture", undefined, "Photo attached from Capture. Pick another to replace it.")
                  : t("m.snags.new.photoHint", undefined, "Required. Point the camera at the defect.")}
            </div>
            {fieldError("photo") && (
              <div className="hint" style={{ color: "var(--p-danger)" }}>
                {fieldError("photo")}
              </div>
            )}
          </div>
          <div className="fld">
            <label htmlFor="snag-project">
              {t("m.snags.new.project", undefined, "Project")}
              <span className="req"> *</span>
            </label>
            <select id="snag-project" name="projectId" defaultValue={projects[0]?.id} required>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="fld">
            <label htmlFor="snag-area">
              {t("m.snags.new.area", undefined, "Where Is It")}
              <span className="req"> *</span>
            </label>
            <input
              id="snag-area"
              type="text"
              name="area"
              required
              maxLength={200}
              placeholder={t("m.snags.new.areaPh", undefined, "e.g. Main stage, SL wing, dock 3")}
            />
            {fieldError("area") && (
              <div className="hint" style={{ color: "var(--p-danger)" }}>
                {fieldError("area")}
              </div>
            )}
          </div>
          <div className="fld">
            <label htmlFor="snag-title">
              {t("m.snags.new.what", undefined, "What's Wrong")}
              <span className="req"> *</span>
            </label>
            <input
              id="snag-title"
              type="text"
              name="title"
              required
              maxLength={200}
              placeholder={t("m.snags.new.whatPh", undefined, "e.g. Handrail bracket loose")}
            />
            {fieldError("title") && (
              <div className="hint" style={{ color: "var(--p-danger)" }}>
                {fieldError("title")}
              </div>
            )}
          </div>
          <div className="fld">
            <label htmlFor="snag-severity">{t("m.snags.new.severity", undefined, "Severity")}</label>
            <select id="snag-severity" name="severity" defaultValue="normal">
              <option value="low">{t("m.snags.new.severity.low", undefined, "Low")}</option>
              <option value="normal">{t("m.snags.new.severity.normal", undefined, "Normal")}</option>
              <option value="high">{t("m.snags.new.severity.high", undefined, "High")}</option>
              <option value="urgent">{t("m.snags.new.severity.urgent", undefined, "Urgent")}</option>
            </select>
          </div>
          <div className="fld">
            <label htmlFor="snag-details">{t("m.snags.new.details", undefined, "Details")}</label>
            <textarea
              id="snag-details"
              name="details"
              maxLength={4000}
              placeholder={t("m.snags.new.detailsPh", undefined, "Anything the fixer needs to know")}
            />
            {/* T1-3 dictation — appends to whatever is typed. Renders nothing
                unless server-side transcription is configured. */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
              <DictationButton onText={(text) => appendTranscriptToTextarea("snag-details", text)} />
            </div>
          </div>
          {state?.error && (
            <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 12 }}>
              {state.error}
            </div>
          )}
          <div className="form-actions">
            <button
              type="button"
              className="ps-btn ps-btn--secondary ps-btn--lg"
              style={{ flex: 1, justifyContent: "center" }}
              onClick={() => router.back()}
            >
              {t("m.snags.new.cancel", undefined, "Cancel")}
            </button>
            <button
              type="submit"
              className="ps-btn ps-btn--cta ps-btn--lg"
              style={{ flex: 2, justifyContent: "center", opacity: pending ? 0.6 : 1 }}
              disabled={pending}
            >
              {pending ? t("m.snags.new.saving", undefined, "Saving…") : t("m.snags.new.submit", undefined, "Raise Snag")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
