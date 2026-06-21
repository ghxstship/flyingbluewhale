"use client";

import { useActionState } from "react";
import { KIcon } from "@/components/mobile/kit";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { DensityToggle } from "@/components/ui/DensityToggle";
import { saveProfile, type State } from "./actions";

export type ProfileData = {
  name: string;
  email: string;
  tagline: string;
  bio: string;
  phone: string;
  certs: string[];
};

type Labels = {
  profileHeading: string;
  name: string;
  tagline: string;
  bio: string;
  contact: string;
  phone: string;
  email: string;
  certs: string;
  noCerts: string;
  save: string;
  saved: string;
  appearance: string;
  theme: string;
  density: string;
  account: string;
  accountStatus: string;
  accountStatusDesc: string;
  signOut: string;
};

export function SettingsView({ data, labels }: { data: ProfileData; labels: Labels }) {
  const [state, formAction, pending] = useActionState<State, FormData>(saveProfile, null);

  return (
    <>
      {/* ── Profile editor ── */}
      <form action={formAction}>
        <div className="sech">
          <h2>{labels.profileHeading}</h2>
        </div>
        {state?.error && (
          <div className="item" style={{ borderColor: "var(--p-danger)" }}>
            <KIcon name="TriangleAlert" size={16} style={{ color: "var(--p-danger)" }} />
            <div className="s" style={{ color: "var(--p-danger)" }}>
              {state.error}
            </div>
          </div>
        )}
        {state?.ok && (
          <div className="item">
            <KIcon name="CircleCheck" size={16} style={{ color: "var(--p-success)" }} />
            <div className="s" style={{ color: "var(--p-success)" }}>
              {labels.saved}
            </div>
          </div>
        )}
        <div className="fld">
          <label>{labels.name}</label>
          <input name="name" defaultValue={state?.values?.name ?? data.name} required />
          {state?.fieldErrors?.name && (
            <div className="s" style={{ color: "var(--p-danger)" }}>
              {state.fieldErrors.name}
            </div>
          )}
        </div>
        <div className="fld">
          <label>{labels.tagline}</label>
          <input name="tagline" defaultValue={state?.values?.tagline ?? data.tagline} />
        </div>
        <div className="fld">
          <label>{labels.bio}</label>
          <textarea name="bio" rows={3} defaultValue={state?.values?.bio ?? data.bio} />
        </div>
        <button
          type="submit"
          className="ps-btn ps-btn--cta"
          disabled={pending}
          style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
        >
          <KIcon name="Check" size={15} /> {labels.save}
        </button>
      </form>

      {/* ── Contact (read-only; sourced from crew_members / users) ── */}
      <div className="sech">
        <h2>{labels.contact}</h2>
      </div>
      {data.phone && (
        <a className="item tap" href={`tel:${data.phone}`} style={{ cursor: "pointer" }}>
          <KIcon name="Phone" size={18} style={{ color: "var(--p-text-2)" }} />
          <div>
            <div className="t">{data.phone}</div>
            <div className="s">{labels.phone}</div>
          </div>
        </a>
      )}
      <a className="item tap" href={`mailto:${data.email}`} style={{ cursor: "pointer" }}>
        <KIcon name="Mail" size={18} style={{ color: "var(--p-text-2)" }} />
        <div>
          <div className="t">{data.email}</div>
          <div className="s">{labels.email}</div>
        </div>
      </a>

      {/* ── Certifications ── */}
      <div className="sech">
        <h2>{labels.certs}</h2>
      </div>
      {data.certs.length === 0 ? (
        <div className="item">
          <div className="s">{labels.noCerts}</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
          {data.certs.map((c) => (
            <span className="tag-chip" key={c}>
              {c}
            </span>
          ))}
        </div>
      )}

      {/* ── Appearance — platform theme + density toggles ── */}
      <div className="sech">
        <h2>{labels.appearance}</h2>
      </div>
      <div className="item" style={{ display: "block" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <KIcon name="SunMoon" size={18} style={{ color: "var(--p-text-2)" }} />
          <div className="t">{labels.theme}</div>
        </div>
        <ThemeToggle />
      </div>
      <div className="item" style={{ display: "block" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <KIcon name="Rows3" size={18} style={{ color: "var(--p-text-2)" }} />
          <div className="t">{labels.density}</div>
        </div>
        <DensityToggle />
      </div>

      {/* ── Account — links to the dedicated pause / archive lifecycle screen ── */}
      <div className="sech">
        <h2>{labels.account}</h2>
      </div>
      <a className="item tap" href="/m/settings/account" style={{ cursor: "pointer" }}>
        <KIcon name="UserCog" size={18} style={{ color: "var(--p-text-2)" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t">{labels.accountStatus}</div>
          <div className="s">{labels.accountStatusDesc}</div>
        </div>
        <KIcon name="ChevronRight" size={16} style={{ color: "var(--p-text-3)" }} />
      </a>

      {/* ── Sign out — canonical /auth/signout POST ── */}
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="ps-btn ps-btn--secondary"
          style={{ width: "100%", justifyContent: "center", margin: "12px 0 4px" }}
        >
          <KIcon name="LogOut" size={15} /> {labels.signOut}
        </button>
      </form>
    </>
  );
}
