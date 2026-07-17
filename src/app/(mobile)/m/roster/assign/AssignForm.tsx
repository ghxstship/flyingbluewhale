"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { KIcon } from "@/components/mobile/kit";
import { assignPerson, type State } from "./actions";

export type PersonOpt = { id: string; name: string; role: string | null };
export type RoleOpt = { id: string; label: string; department: string | null; rateCardItemId: string | null };
export type RateOpt = { id: string; label: string };
export type ManagerOpt = { id: string; label: string };

/**
 * Kit 30 · Assign Person form — native-form idiom (per /m/daily-log/new;
 * no kit FormScreen def exists for engagements and inventing one would be a
 * conformance violation). Person → role (rate prefills from the role's
 * matching rate card, editable) → contract dates (defaulted to the project
 * window) → reports-to → Send Offer Letter On Save toggle.
 */
export function AssignForm({
  projectId,
  projectName,
  defaultStart,
  defaultEnd,
  people,
  roles,
  rates,
  managers,
}: {
  projectId: string;
  projectName: string;
  defaultStart: string | null;
  defaultEnd: string | null;
  people: PersonOpt[];
  roles: RoleOpt[];
  rates: RateOpt[];
  managers: ManagerOpt[];
}) {
  const router = useRouter();
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<State>(null);
  const [roleId, setRoleId] = useState("");
  const [rateId, setRateId] = useState("");
  const [ratePrefilled, setRatePrefilled] = useState(false);
  const [sendOffer, setSendOffer] = useState(true);

  function onRoleChange(nextRoleId: string) {
    setRoleId(nextRoleId);
    const role = roles.find((r) => r.id === nextRoleId);
    // Prefill only when the manager hasn't hand-picked a rate yet (or the
    // current value is itself a prefill) — an explicit edit always wins.
    if (role?.rateCardItemId && (ratePrefilled || rateId === "")) {
      setRateId(role.rateCardItemId);
      setRatePrefilled(true);
    }
  }

  function onSubmit(fd: FormData) {
    if (pending) return;
    setState(null);
    startTransition(async () => {
      const res = await assignPerson(null, fd);
      if (res?.error) {
        setState(res);
        return;
      }
      router.push("/m/roster");
      router.refresh();
    });
  }

  const fieldError = (k: string) => state?.fieldErrors?.[k];

  return (
    <form action={onSubmit}>
      <input type="hidden" name="projectId" value={projectId} />
      <div className="fld">
        <label>
          {t("m.roster.assign.person", undefined, "Person")}
          <span className="req"> *</span>
        </label>
        <select name="crewMemberId" defaultValue="" required>
          <option value="" disabled>
            {t("m.roster.assign.personPh", undefined, "Search The Org Directory")}
          </option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.role ? `${p.name} · ${p.role}` : p.name}
            </option>
          ))}
        </select>
        {fieldError("crewMemberId") && (
          <div className="hint" style={{ color: "var(--p-danger)" }}>
            {fieldError("crewMemberId")}
          </div>
        )}
      </div>

      <div className="fld">
        <label>
          {t("m.roster.assign.role", undefined, "Role On Project")}
          <span className="req"> *</span>
        </label>
        <select name="roleId" value={roleId} onChange={(e) => onRoleChange(e.target.value)} required>
          <option value="" disabled>
            {t("m.roster.assign.rolePh", undefined, "Pick From The Position Catalog")}
          </option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.department ? `${r.label} · ${r.department}` : r.label}
            </option>
          ))}
        </select>
        {fieldError("roleId") && (
          <div className="hint" style={{ color: "var(--p-danger)" }}>
            {fieldError("roleId")}
          </div>
        )}
      </div>

      <div className="fld">
        <label>{t("m.roster.assign.rate", undefined, "Rate Card")}</label>
        <select
          name="rateCardItemId"
          value={rateId}
          onChange={(e) => {
            setRateId(e.target.value);
            setRatePrefilled(false);
          }}
        >
          <option value="">{t("m.roster.assign.rateTbd", undefined, "To Be Confirmed")}</option>
          {rates.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
        {ratePrefilled && rateId && (
          <div className="hint">
            {t("m.roster.assign.ratePrefill", undefined, "Prefilled From The Rate Card. Edit To Override.")}
          </div>
        )}
      </div>

      <div className="fld">
        <label>{t("m.roster.assign.basis", undefined, "Terms Basis")}</label>
        <select name="compensationBasis" defaultValue="per_day">
          <option value="per_day">{t("m.roster.assign.basis.perDay", undefined, "Per Day")}</option>
          <option value="per_show_day">{t("m.roster.assign.basis.perShowDay", undefined, "Per Show Day")}</option>
          <option value="flat_fee">{t("m.roster.assign.basis.flat", undefined, "Flat Project Fee")}</option>
          <option value="hourly">{t("m.roster.assign.basis.hourly", undefined, "Hourly")}</option>
          <option value="tbd">{t("m.roster.assign.basis.tbd", undefined, "To Be Confirmed")}</option>
        </select>
      </div>

      <div className="frow">
        <div className="fld">
          <label>{t("m.roster.assign.start", undefined, "Contract Start")}</label>
          <input type="date" name="startDate" defaultValue={defaultStart ?? undefined} />
        </div>
        <div className="fld">
          <label>{t("m.roster.assign.end", undefined, "Contract End")}</label>
          <input type="date" name="endDate" defaultValue={defaultEnd ?? undefined} />
          {fieldError("endDate") && (
            <div className="hint" style={{ color: "var(--p-danger)" }}>
              {fieldError("endDate")}
            </div>
          )}
        </div>
      </div>
      <div className="hint" style={{ marginTop: -8, marginBottom: 16 }}>
        {t("m.roster.assign.datesHint", { project: projectName }, `Defaulted to the ${projectName} window.`)}
      </div>

      <div className="fld">
        <label>{t("m.roster.assign.reportsTo", undefined, "Reports To")}</label>
        <select name="reportsTo" defaultValue="">
          <option value="">{t("m.roster.assign.reportsToLater", undefined, "Set Later")}</option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        {fieldError("reportsTo") && (
          <div className="hint" style={{ color: "var(--p-danger)" }}>
            {fieldError("reportsTo")}
          </div>
        )}
      </div>

      <div
        className="item tap"
        role="switch"
        aria-checked={sendOffer}
        tabIndex={0}
        style={{ cursor: "pointer" }}
        onClick={() => setSendOffer((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setSendOffer((v) => !v);
          }
        }}
      >
        <div style={{ flex: 1 }}>
          <div className="t">{t("m.roster.assign.sendOffer", undefined, "Send Offer Letter On Save")}</div>
          <div className="s">
            {t("m.roster.assign.sendOfferSub", undefined, "Creates The Engagement Plus Offer In One Step")}
          </div>
        </div>
        <span className="switch" data-on={sendOffer || undefined}>
          <span className="knob" />
        </span>
      </div>
      {sendOffer && <input type="hidden" name="sendOffer" value="1" />}

      {state?.error && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 12, marginTop: 12 }}>
          {state.error}
        </div>
      )}

      <div className="form-actions" style={{ marginTop: 12 }}>
        <button
          type="button"
          className="ps-btn ps-btn--secondary ps-btn--lg"
          style={{ flex: 1, justifyContent: "center" }}
          onClick={() => router.back()}
        >
          {t("m.roster.assign.cancel", undefined, "Cancel")}
        </button>
        <button
          type="submit"
          className="ps-btn ps-btn--cta ps-btn--lg"
          style={{ flex: 2, justifyContent: "center", opacity: pending ? 0.6 : 1 }}
          disabled={pending}
        >
          <KIcon name="UserRoundPlus" size={16} />
          {pending
            ? t("m.roster.assign.saving", undefined, "Saving…")
            : sendOffer
              ? t("m.roster.assign.submitSend", undefined, "Assign & Send Offer")
              : t("m.roster.assign.submit", undefined, "Assign")}
        </button>
      </div>
    </form>
  );
}
