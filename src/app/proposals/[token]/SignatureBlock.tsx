"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "@/lib/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { signProposalAction, type SignState } from "./actions";
import { formatDate } from "@/lib/i18n/format";
import { useT } from "@/lib/i18n/LocaleProvider";

type Party = { role: string; name?: string; email?: string };

export function SignatureBlock({
  proposalId,
  token,
  parties,
  instructions,
  alreadySigned,
  signerName,
  signedAt,
}: {
  proposalId: string;
  token: string;
  parties: Party[];
  instructions?: string;
  alreadySigned: boolean;
  signerName: string | null;
  signedAt: string | null;
}) {
  void proposalId;
  const t = useT();
  const [mode, setMode] = useState<"typed" | "canvas">("typed");
  const [typed, setTyped] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasInk, setHasInk] = useState(false);

  const [state, formAction, pending] = useActionState<SignState, FormData>(async (prev, fd) => {
    const res = await signProposalAction(prev, fd);
    if (res?.error) toast.error(res.error);
    else if (res?.ok)
      toast.success(t("legal.proposalSignature.signedToast", { hash: res.ok.hash }, `Signed · ${res.ok.hash}`));
    return res;
  }, null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = Math.floor(rect.width * ratio);
    c.height = Math.floor(rect.height * ratio);
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    // Proposal docs stay in light mode intentionally (for print); derive stroke
    // color from the computed foreground token rather than a hard-coded hex.
    const computedText =
      typeof window !== "undefined"
        ? getComputedStyle(document.documentElement).getPropertyValue("--p-text-1").trim()
        : "";
    ctx.strokeStyle = computedText || "rgb(17,17,17)";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
  }, [mode]);

  const point = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
  };

  const onDown = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    ev.currentTarget.setPointerCapture(ev.pointerId);
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = point(ev);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    setDrawing(true);
  };
  const onMove = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = point(ev);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    setHasInk(true);
  };
  const onUp = () => setDrawing(false);

  const clear = () => {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
  };

  if (alreadySigned) {
    return (
      <section className="print-hide-sibling mx-auto my-12 max-w-4xl px-8">
        <div className="surface p-8 text-center">
          <div className="text-[11px] font-semibold tracking-[0.25em] text-[var(--p-success)] uppercase">
            {t("legal.proposalSignature.signedEyebrow", undefined, "Signed")}
          </div>
          <div className="font-display mt-3 text-[length:var(--p-fs-display-sm)] tracking-tight">
            {t(
              "legal.proposalSignature.thankYou",
              { name: signerName ?? t("legal.proposalSignature.signerFallback", undefined, "signer") },
              `Thank you, ${signerName ?? "signer"}`,
            )}
          </div>
          <div className="mt-2 font-mono text-xs text-[var(--p-text-2)]">
            {t(
              "legal.proposalSignature.signedOn",
              { date: formatDate(signedAt, "long") },
              `Signed ${formatDate(signedAt, "long")}`,
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="authorize" className="mx-auto my-12 max-w-4xl px-8">
      <div className="surface p-8">
        <div className="text-[11px] font-semibold tracking-[0.25em] text-[var(--p-accent)] uppercase">
          {t("legal.proposalSignature.authorizeEyebrow", undefined, "Authorize")}
        </div>
        <h2 className="font-display mt-3 text-[length:var(--p-fs-display-sm)] tracking-tight">
          {t("legal.proposalSignature.acceptHeading", undefined, "Accept this proposal")}
        </h2>
        {instructions && <p className="mt-2 text-sm text-[var(--p-text-2)]">{instructions}</p>}

        {parties.length > 1 && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {parties.map((p, i) => (
              <div key={i} className="surface p-3 text-xs">
                <div className="font-semibold tracking-wider text-[var(--p-text-2)] uppercase">{p.role}</div>
                <div className="mt-1">{p.name ?? "—"}</div>
                {p.email && <div className="font-mono text-[11px] text-[var(--p-text-2)]">{p.email}</div>}
              </div>
            ))}
          </div>
        )}

        <form action={formAction} className="mt-6 space-y-4">
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="kind" value={mode} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label={t("legal.proposalSignature.yourNameLabel", undefined, "Your Name")} name="name" required />
            <Input label={t("legal.proposalSignature.emailLabel", undefined, "Email")} name="email" type="email" />
          </div>
          <Input
            label={t("legal.proposalSignature.titleRoleLabel", undefined, "Title / role")}
            name="role"
            placeholder={t("legal.proposalSignature.titleRolePlaceholder", undefined, "Founder, Producer, COO…")}
          />

          <div className="inline-flex rounded-full border border-[var(--p-border)] bg-[var(--p-surface)] p-0.5">
            <button
              type="button"
              onClick={() => setMode("typed")}
              className={`rounded-full px-3 py-1 text-xs ${mode === "typed" ? "bg-[var(--p-bg)]" : "text-[var(--p-text-2)]"}`}
            >
              {t("legal.proposalSignature.type", undefined, "Type")}
            </button>
            <button
              type="button"
              onClick={() => setMode("canvas")}
              className={`rounded-full px-3 py-1 text-xs ${mode === "canvas" ? "bg-[var(--p-bg)]" : "text-[var(--p-text-2)]"}`}
            >
              {t("legal.proposalSignature.draw", undefined, "Draw")}
            </button>
          </div>

          {mode === "typed" ? (
            <>
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={t("legal.proposalSignature.typeSignaturePlaceholder", undefined, "Type your signature")}
                className="ps-input font-subdisplay w-full text-3xl tracking-wide"
              />
              <input type="hidden" name="data" value={typed} />
            </>
          ) : (
            <>
              <div className="surface-inset h-40 overflow-hidden">
                <canvas
                  ref={canvasRef}
                  onPointerDown={onDown}
                  onPointerMove={onMove}
                  onPointerUp={onUp}
                  onPointerLeave={onUp}
                  className="block h-full w-full touch-none"
                />
              </div>
              <CanvasSync canvasRef={canvasRef} hasInk={hasInk} />
              <button type="button" onClick={clear} className="text-xs text-[var(--p-text-2)] hover:underline">
                {t("legal.proposalSignature.clear", undefined, "Clear")}
              </button>
            </>
          )}

          {state?.error && <Alert kind="error">{state.error}</Alert>}

          {/* E-20: e-signature consent + evidence disclosure (mirrors the
              offer-letter flow's language). */}
          <p className="text-xs leading-relaxed text-[var(--p-text-2)]">
            {t(
              "legal.proposalSignature.consent",
              undefined,
              "By signing, you consent to do business electronically and agree that your signature, name, IP address, and timestamp will be recorded as evidence of agreement, with the same legal effect as a handwritten signature.",
            )}
          </p>

          <div className="flex items-center justify-end gap-2">
            <Button type="submit" disabled={pending || (mode === "typed" ? !typed.trim() : !hasInk)}>
              {pending
                ? t("legal.proposalSignature.signing", undefined, "Signing…")
                : t("legal.proposalSignature.signAndAccept", undefined, "Sign & accept")}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}

function CanvasSync({ canvasRef, hasInk }: { canvasRef: React.RefObject<HTMLCanvasElement | null>; hasInk: boolean }) {
  const [data, setData] = useState<string>("");
  useEffect(() => {
    if (!hasInk) return;
    const c = canvasRef.current;
    if (!c) return;
    try {
      setData(c.toDataURL("image/png"));
    } catch {
      setData("");
    }
  }, [hasInk, canvasRef]);
  return <input type="hidden" name="data" value={data} />;
}
