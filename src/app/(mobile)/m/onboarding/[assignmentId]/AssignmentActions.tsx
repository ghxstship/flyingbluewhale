"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { SignaturePad } from "@/components/ui/SignaturePad";
import { useT } from "@/lib/i18n/LocaleProvider";
import { completeSignStep, completeStep, completeUploadStep, finalizeAssignment, type State } from "../actions";

/**
 * Onboarding step controls. Client islands so failures render inline instead
 * of replacing the page with the route error boundary.
 *
 * The blanket "Mark Done" attest survives ONLY for the kinds that have no
 * artifact machine yet (quiz/course/form). The branched kinds get real
 * controls (KIT28 §3 item 5):
 *
 *   UploadStepForm — a real file input; the server stores the file.
 *   SignStepForm   — SignaturePad + the typed-name a11y alternative.
 *   ReadStepGate   — the confirm stays disabled until the content has been
 *                    scrolled to its end.
 */

export function MarkStepDoneButton({ assignmentId, stepId }: { assignmentId: string; stepId: string }) {
  const t = useT();
  const [state, formAction, pending] = useActionState<State, FormData>(completeStep, null);
  return (
    <form action={formAction} className="mt-3 flex flex-col items-end gap-1">
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <input type="hidden" name="stepId" value={stepId} />
      <button type="submit" disabled={pending} className="ps-btn ps-btn--sm">
        {pending ? t("m.onboarding.marking", undefined, "Saving…") : t("m.onboarding.markDone", undefined, "Mark Done")}
      </button>
      {state?.error && <p className="text-xs text-[var(--p-danger)]">{state.error}</p>}
    </form>
  );
}

export function UploadStepForm({ assignmentId, stepId }: { assignmentId: string; stepId: string }) {
  const t = useT();
  const [state, formAction, pending] = useActionState<State, FormData>(completeUploadStep, null);
  const [hasFile, setHasFile] = useState(false);
  return (
    <form action={formAction} className="mt-3 space-y-2">
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <input type="hidden" name="stepId" value={stepId} />
      <input
        type="file"
        name="file"
        required
        accept="image/*,application/pdf"
        aria-label={t("m.onboarding.upload.file", undefined, "File to upload")}
        className="ps-input w-full text-xs"
        onChange={(e) => setHasFile((e.target.files?.length ?? 0) > 0)}
      />
      <div className="flex flex-col items-end gap-1">
        <button type="submit" disabled={pending || !hasFile} className="ps-btn ps-btn--sm">
          {pending
            ? t("m.onboarding.upload.saving", undefined, "Uploading…")
            : t("m.onboarding.upload.submit", undefined, "Upload And Complete")}
        </button>
        {state?.error && <p className="text-xs text-[var(--p-danger)]">{state.error}</p>}
      </div>
    </form>
  );
}

export function SignStepForm({ assignmentId, stepId }: { assignmentId: string; stepId: string }) {
  const t = useT();
  const [state, formAction, pending] = useActionState<State, FormData>(completeSignStep, null);
  const [signature, setSignature] = useState<string | null>(null);
  const [typedName, setTypedName] = useState("");
  const typedId = `onb-typed-${stepId}`;
  return (
    <form action={formAction} className="mt-3 space-y-2">
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <input type="hidden" name="stepId" value={stepId} />
      <input type="hidden" name="signature" value={signature ?? ""} />
      <SignaturePad
        label={t("m.onboarding.sign.pad", undefined, "Signature")}
        onChange={setSignature}
        onClear={() => setSignature(null)}
      />
      <div>
        <label htmlFor={typedId} className="text-xs text-[var(--p-text-2)]">
          {t("m.onboarding.sign.typed", undefined, "Or type your full name")}
        </label>
        <input
          id={typedId}
          type="text"
          name="typedName"
          value={typedName}
          onChange={(e) => setTypedName(e.target.value)}
          placeholder={t("m.onboarding.sign.typedPh", undefined, "Full name")}
          autoComplete="name"
          maxLength={120}
          className="ps-input mt-1 w-full"
        />
      </div>
      <div className="flex flex-col items-end gap-1">
        <button type="submit" disabled={pending || (!signature && !typedName.trim())} className="ps-btn ps-btn--sm">
          {pending
            ? t("m.onboarding.sign.saving", undefined, "Signing…")
            : t("m.onboarding.sign.submit", undefined, "Sign And Complete")}
        </button>
        {state?.error && <p className="text-xs text-[var(--p-danger)]">{state.error}</p>}
      </div>
    </form>
  );
}

export function ReadStepGate({
  assignmentId,
  stepId,
  content,
}: {
  assignmentId: string;
  stepId: string;
  content: string;
}) {
  const t = useT();
  const [state, formAction, pending] = useActionState<State, FormData>(completeStep, null);
  const [readToEnd, setReadToEnd] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => {
      // 8px of slack so sub-pixel rounding can't strand the last line.
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 8) setReadToEnd(true);
    };
    check(); // short content never scrolls — the gate opens immediately
    el.addEventListener("scroll", check, { passive: true });
    return () => el.removeEventListener("scroll", check);
  }, []);

  return (
    <div className="mt-3 space-y-2">
      <div
        ref={scrollRef}
        data-testid="read-gate-content"
        className="max-h-44 overflow-y-auto whitespace-pre-wrap rounded-[var(--p-r-md)] border border-[var(--p-border)] p-3 text-xs text-[var(--p-text-2)]"
      >
        {content}
      </div>
      <form action={formAction} className="flex flex-col items-end gap-1">
        <input type="hidden" name="assignmentId" value={assignmentId} />
        <input type="hidden" name="stepId" value={stepId} />
        <button type="submit" disabled={pending || !readToEnd} className="ps-btn ps-btn--sm">
          {pending
            ? t("m.onboarding.marking", undefined, "Saving…")
            : t("m.onboarding.read.confirm", undefined, "I Have Read This")}
        </button>
        {!readToEnd && (
          <p className="text-xs text-[var(--p-text-3)]">
            {t("m.onboarding.read.hint", undefined, "Scroll to the end to confirm.")}
          </p>
        )}
        {state?.error && <p className="text-xs text-[var(--p-danger)]">{state.error}</p>}
      </form>
    </div>
  );
}

export function FinalizeButton({ assignmentId }: { assignmentId: string }) {
  const t = useT();
  const [state, formAction, pending] = useActionState<State, FormData>(finalizeAssignment, null);
  return (
    <form action={formAction} className="mt-6 space-y-2">
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <button type="submit" disabled={pending} className="ps-btn w-full">
        {pending
          ? t("m.onboarding.finishing", undefined, "Finishing…")
          : t("m.onboarding.finish", undefined, "Finish Onboarding")}
      </button>
      {state?.error && <p className="text-center text-xs text-[var(--p-danger)]">{state.error}</p>}
    </form>
  );
}
