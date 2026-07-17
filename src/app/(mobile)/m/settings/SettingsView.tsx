"use client";

import { useActionState } from "react";
import { KIcon } from "@/components/mobile/kit";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { DensityToggle } from "@/components/ui/DensityToggle";
import { saveProfile, type State } from "./actions";

export type ProfileData = {
  name: string;
  email: string;
  pronouns: string;
  roleTitle: string;
  tagline: string;
  bio: string;
  phone: string;
  locationCity: string;
  locationRegion: string;
  country: string;
  dietaryRestrictions: string;
  linkedin: string;
  spotify: string;
  instagram: string;
  website: string;
  emergency1Name: string;
  emergency1Relationship: string;
  emergency1Phone: string;
  emergency2Name: string;
  emergency2Relationship: string;
  emergency2Phone: string;
  homeAirport: string;
  dateOfBirth: string;
  passportNumber: string;
  knownTravelerNumber: string;
  visas: string;
  loyaltyPrograms: string;
  shirt: string;
  pants: string;
  shoe: string;
  glove: string;
  hat: string;
  certifications: string;
  skills: string;
};

type Labels = {
  profileHeading: string;
  name: string;
  pronouns: string;
  roleTitle: string;
  tagline: string;
  bio: string;
  contact: string;
  phone: string;
  email: string;
  city: string;
  region: string;
  country: string;
  emergency: string;
  contactName: string;
  relationship: string;
  social: string;
  linkedin: string;
  spotify: string;
  instagram: string;
  website: string;
  dietary: string;
  dietaryLabel: string;
  travel: string;
  homeAirport: string;
  dob: string;
  passport: string;
  knownTraveler: string;
  visas: string;
  loyalty: string;
  uniform: string;
  shirt: string;
  pants: string;
  shoe: string;
  glove: string;
  hat: string;
  credentials: string;
  certs: string;
  skills: string;
  setHint: string;
  save: string;
  saved: string;
  appearance: string;
  theme: string;
  density: string;
  account: string;
  accountStatus: string;
  notifPrefs: string;
  notifPrefsDesc: string;
  accountStatusDesc: string;
  changelog: string;
  changelogDesc: string;
  about: string;
  aboutDesc: string;
  support: string;
  supportDesc: string;
  signOut: string;
};

function Fld({
  label,
  name,
  defaultValue,
  error,
  type,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  error?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="fld">
      <label>{label}</label>
      <input name={name} type={type} defaultValue={defaultValue} placeholder={placeholder} required={required} />
      {error && (
        <div className="s" style={{ color: "var(--p-danger)" }}>
          {error}
        </div>
      )}
    </div>
  );
}

export function SettingsView({ data, labels }: { data: ProfileData; labels: Labels }) {
  const [state, formAction, pending] = useActionState<State, FormData>(saveProfile, null);
  const v = (key: keyof ProfileData) => state?.values?.[key] ?? data[key];
  const half = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 } as const;

  return (
    <>
      <form action={formAction}>
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

        {/* ── Identity ── */}
        <div className="sech">
          <h2>{labels.profileHeading}</h2>
        </div>
        <Fld label={labels.name} name="name" defaultValue={v("name")} error={state?.fieldErrors?.name} required />
        <div style={half}>
          <Fld label={labels.pronouns} name="pronouns" defaultValue={v("pronouns")} placeholder="they/them" />
          <Fld label={labels.roleTitle} name="role_title" defaultValue={v("roleTitle")} placeholder="Gate & Access · Lead" />
        </div>
        <Fld label={labels.tagline} name="tagline" defaultValue={v("tagline")} />
        <div className="fld">
          <label>{labels.bio}</label>
          <textarea name="bio" rows={3} defaultValue={v("bio")} />
        </div>

        {/* ── Contact ── */}
        <div className="sech">
          <h2>{labels.contact}</h2>
        </div>
        <div className="fld">
          <label>{labels.email}</label>
          <input value={data.email} disabled readOnly />
        </div>
        <Fld label={labels.phone} name="phone" type="tel" defaultValue={v("phone")} placeholder="+1 (305) 555-0199" />
        <div style={half}>
          <Fld label={labels.city} name="location_city" defaultValue={v("locationCity")} />
          <Fld label={labels.region} name="location_region" defaultValue={v("locationRegion")} />
        </div>
        <Fld label={labels.country} name="country" defaultValue={v("country")} />

        {/* ── Emergency Contacts ── */}
        <div className="sech">
          <h2>{labels.emergency}</h2>
        </div>
        <Fld label={`${labels.contactName} 1`} name="emergency_1_name" defaultValue={v("emergency1Name")} />
        <div style={half}>
          <Fld label={labels.relationship} name="emergency_1_relationship" defaultValue={v("emergency1Relationship")} />
          <Fld label={labels.phone} name="emergency_1_phone" type="tel" defaultValue={v("emergency1Phone")} />
        </div>
        <Fld label={`${labels.contactName} 2`} name="emergency_2_name" defaultValue={v("emergency2Name")} />
        <div style={half}>
          <Fld label={labels.relationship} name="emergency_2_relationship" defaultValue={v("emergency2Relationship")} />
          <Fld label={labels.phone} name="emergency_2_phone" type="tel" defaultValue={v("emergency2Phone")} />
        </div>

        {/* ── Social ── */}
        <div className="sech">
          <h2>{labels.social}</h2>
        </div>
        <Fld label={labels.linkedin} name="linkedin" defaultValue={v("linkedin")} placeholder="linkedin.com/in/…" />
        <Fld label={labels.spotify} name="spotify" defaultValue={v("spotify")} placeholder="open.spotify.com/user/…" />
        <Fld label={labels.instagram} name="instagram" defaultValue={v("instagram")} placeholder="@handle" />
        <Fld label={labels.website} name="website" defaultValue={v("website")} placeholder="example.com" />

        {/* ── Dietary ── */}
        <div className="sech">
          <h2>{labels.dietary}</h2>
        </div>
        <Fld
          label={labels.dietaryLabel}
          name="dietary_restrictions"
          defaultValue={v("dietaryRestrictions")}
          placeholder="Vegetarian · no shellfish"
        />

        {/* ── Travel ── */}
        <div className="sech">
          <h2>{labels.travel}</h2>
        </div>
        <div style={half}>
          <Fld label={labels.homeAirport} name="home_airport" defaultValue={v("homeAirport")} placeholder="MIA" />
          <Fld label={labels.dob} name="date_of_birth" defaultValue={v("dateOfBirth")} placeholder="YYYY-MM-DD" />
        </div>
        <div style={half}>
          <Fld label={labels.passport} name="passport_number" defaultValue={v("passportNumber")} />
          <Fld label={labels.knownTraveler} name="known_traveler_number" defaultValue={v("knownTravelerNumber")} />
        </div>
        <div style={half}>
          <Fld label={labels.visas} name="visas" defaultValue={v("visas")} placeholder="US · EU" />
          <Fld label={labels.loyalty} name="loyalty_programs" defaultValue={v("loyaltyPrograms")} placeholder="AA · Marriott" />
        </div>

        {/* ── Uniform ── */}
        <div className="sech">
          <h2>{labels.uniform}</h2>
        </div>
        <div style={half}>
          <Fld label={labels.shirt} name="shirt" defaultValue={v("shirt")} placeholder="L" />
          <Fld label={labels.pants} name="pants" defaultValue={v("pants")} placeholder="32×32" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <Fld label={labels.shoe} name="shoe" defaultValue={v("shoe")} placeholder="10.5" />
          <Fld label={labels.glove} name="glove" defaultValue={v("glove")} placeholder="L" />
          <Fld label={labels.hat} name="hat" defaultValue={v("hat")} placeholder="M" />
        </div>

        {/* ── Credentials ── */}
        <div className="sech">
          <h2>{labels.credentials}</h2>
        </div>
        <div className="fld">
          <label>{labels.certs}</label>
          <input name="certifications" defaultValue={v("certifications")} placeholder="SIA · OSHA-30 · First Aid" />
          <div className="s" style={{ color: "var(--p-text-3)" }}>
            {labels.setHint}
          </div>
        </div>
        <div className="fld">
          <label>{labels.skills}</label>
          <input name="skills" defaultValue={v("skills")} placeholder="Crowd mgmt · radios · forklift" />
          <div className="s" style={{ color: "var(--p-text-3)" }}>
            {labels.setHint}
          </div>
        </div>

        <button
          type="submit"
          className="ps-btn ps-btn--cta"
          disabled={pending}
          style={{ width: "100%", justifyContent: "center", marginTop: 6 }}
        >
          <KIcon name="Check" size={15} /> {labels.save}
        </button>
      </form>

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

      {/* Notification preferences — the per-kind matrix. It wore the bell's
          route (/m/notifications) for months while the actual feed sat on
          /m/alerts; now the feed owns the bell and the matrix lives here,
          which is where its own docblock always said it belonged. */}
      <a className="item tap" href="/m/settings/notifications" style={{ cursor: "pointer" }}>
        <KIcon name="Bell" size={18} style={{ color: "var(--p-text-2)" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t">{labels.notifPrefs}</div>
          <div className="s">{labels.notifPrefsDesc}</div>
        </div>
        <KIcon name="ChevronRight" size={16} style={{ color: "var(--p-text-3)" }} />
      </a>

      {/* ── What's New — the kit's Changelog surface. This link is the ONLY
           thing that makes /m/settings/changelog reachable: the sitemap marks
           it `linked` merely because /m/settings is in nav, so the generator
           would report 0 orphans even with no route into it. ── */}
      <a className="item tap" href="/m/settings/changelog" style={{ cursor: "pointer" }}>
        <KIcon name="Sparkles" size={18} style={{ color: "var(--p-text-2)" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t">{labels.changelog}</div>
          <div className="s">{labels.changelogDesc}</div>
        </div>
        <KIcon name="ChevronRight" size={16} style={{ color: "var(--p-text-3)" }} />
      </a>

      {/* ── Help & Support + About · Legal — kit 29 standalone-app surfaces
           (app-store requirements). Support is the FAQ/contact/report hub;
           About renders version, licenses, privacy & terms in-app. ── */}
      <a className="item tap" href="/m/support" style={{ cursor: "pointer" }}>
        <KIcon name="LifeBuoy" size={18} style={{ color: "var(--p-text-2)" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t">{labels.support}</div>
          <div className="s">{labels.supportDesc}</div>
        </div>
        <KIcon name="ChevronRight" size={16} style={{ color: "var(--p-text-3)" }} />
      </a>
      <a className="item tap" href="/m/settings/about" style={{ cursor: "pointer" }}>
        <KIcon name="Info" size={18} style={{ color: "var(--p-text-2)" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t">{labels.about}</div>
          <div className="s">{labels.aboutDesc}</div>
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
