"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { KIcon } from "@/components/mobile/kit";
import { EmptyState } from "@/components/ui/EmptyState";
import { useT } from "@/lib/i18n/LocaleProvider";
import { batchCheckIn, type BatchState } from "./actions";

export type BatchAsset = { id: string; name: string; sub: string };

/** Multi-select returnable gear → batch check-in confirm. */
export function BatchCheckIn({ assets }: { assets: BatchAsset[] }) {
  const t = useT();
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [state, formAction, pending] = useActionState<BatchState, FormData>(batchCheckIn, null);

  const toggle = (id: string) =>
    setSel((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  return (
    <>
      <Link href="/m/check-in" className="backbtn">
        <KIcon name="ChevronLeft" size={17} /> {t("m.batch.back", undefined, "Check-In")}
      </Link>
      <div className="scr-eye">
        {sel.size} {t("m.batch.of", undefined, "of")} {assets.length} {t("m.batch.selected", undefined, "selected")}
      </div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>{t("m.batch.title", undefined, "Batch Check-In")}</h1>
      <div className="hint" style={{ marginBottom: 10 }}>
        {t("m.batch.hint", undefined, "Select assigned gear to return in one pass.")}
      </div>

      {assets.length === 0 ? (
        <EmptyState
          title={t("m.batch.empty", undefined, "Nothing to return")}
          description={t("m.batch.emptyHint", undefined, "You have no checked-out gear right now.")}
        />
      ) : (
        <>
          <button
            type="button"
            className="viewall"
            style={{ marginBottom: 8 }}
            onClick={() => setSel(new Set(assets.map((a) => a.id)))}
          >
            <KIcon name="CheckCheck" size={14} /> {t("m.batch.selectAll", undefined, "Select all")}
          </button>
          {assets.map((a) => {
            const on = sel.has(a.id);
            return (
              <div className="item tap" key={a.id} style={{ cursor: "pointer" }} onClick={() => toggle(a.id)}>
                <span className="check" data-on={on ? "1" : undefined}>
                  {on && <KIcon name="Check" size={14} stroke={3} />}
                </span>
                <span className="cart-thumb" style={{ width: 38, height: 38 }}>
                  <KIcon name="Package" size={16} style={{ color: "var(--p-text-3)" }} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="t">{a.name}</div>
                  <div className="s">{a.sub}</div>
                </div>
              </div>
            );
          })}

          <form action={formAction}>
            {[...sel].map((id) => (
              <input key={id} type="hidden" name="ids" value={id} />
            ))}
            <button
              type="submit"
              className="ps-btn ps-btn--cta ps-btn--lg"
              style={{ width: "100%", justifyContent: "center", marginTop: 14, opacity: sel.size ? 1 : 0.5 }}
              disabled={!sel.size || pending}
            >
              <KIcon name="PackageCheck" size={16} />{" "}
              {pending
                ? t("m.batch.working", undefined, "Checking in…")
                : `${t("m.batch.cta", undefined, "Check In")} ${sel.size || ""} ${t("m.batch.ctaTail", undefined, "Selected")}`}
            </button>
          </form>
        </>
      )}

      {state?.ok != null && (
        <div className="import-note" style={{ marginTop: 14 }}>
          <KIcon name="PackageCheck" size={15} style={{ color: "var(--p-success)" }} />
          <span style={{ fontSize: 12 }}>
            {state.ok} {t("m.batch.done", undefined, "asset(s) checked in.")}
          </span>
        </div>
      )}
      {state?.error && (
        <div className="import-note" style={{ marginTop: 14 }}>
          <KIcon name="TriangleAlert" size={15} style={{ color: "var(--p-danger)" }} />
          <span style={{ fontSize: 12 }}>{state.error}</span>
        </div>
      )}
    </>
  );
}
