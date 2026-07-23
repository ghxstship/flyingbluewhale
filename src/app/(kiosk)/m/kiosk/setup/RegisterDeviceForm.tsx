"use client";

import { useActionState } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { registerKioskDevice, type State } from "./actions";

export type ProjectOption = { id: string; name: string };

/** Manager-only register form — label + optional project binding. */
export function RegisterDeviceForm({ projects }: { projects: ProjectOption[] }) {
  const t = useT();
  const [state, formAction, pending] = useActionState<State, FormData>(registerKioskDevice, null);

  return (
    <form action={formAction}>
      {state?.error && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 12 }}>
          {state.error}
        </div>
      )}
      <div className="fld">
        <label htmlFor="label">{t("m.kiosk.setup.labelField", undefined, "Device name")}</label>
        <input
          id="label"
          name="label"
          required
          maxLength={80}
          placeholder={t("m.kiosk.setup.labelHint", undefined, "e.g. Load-In Gate iPad")}
        />
      </div>
      <div className="fld">
        <label htmlFor="project_id">{t("m.kiosk.setup.projectField", undefined, "Bind to a production (optional)")}</label>
        <select id="project_id" name="project_id" className="ps-input" defaultValue="">
          <option value="">{t("m.kiosk.setup.projectAny", undefined, "Whole workspace")}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="ps-btn ps-btn--cta ps-btn--lg"
        style={{ width: "100%", justifyContent: "center", marginTop: 12, minHeight: 48 }}
        disabled={pending}
      >
        {pending
          ? t("m.kiosk.setup.registering", undefined, "Registering…")
          : t("m.kiosk.setup.registerCta", undefined, "Register This Device")}
      </button>
    </form>
  );
}
