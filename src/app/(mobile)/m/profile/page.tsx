import Link from "next/link";
import { fmtPosition } from "@/lib/mobile/fmt-position";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { urlFor } from "@/lib/urls";
import { KIcon } from "@/components/mobile/kit";
import { ShareProfileButton } from "./ShareProfileButton";

export const dynamic = "force-dynamic";

/**
 * /m/profile — the crew member's self-showcase (kit reference `tab==="profile"`).
 * A read surface over the same real profile tables the `/m/settings` editor
 * writes (`user_profiles`, `user_social_links`, `emergency_contacts`,
 * `user_travel_profiles`, `user_uniform_sizes`, `user_certifications`,
 * `user_skills`) plus earned `badge_awards`→`badges` and received `reviews`.
 * Editing lives in `/m/settings`; "My Rose" is `/m/pass`. No mock data — each
 * section simply omits itself when its backing table is empty.
 */

function Stars({ n }: { n: number }) {
  return (
    <span style={{ display: "inline-flex" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <KIcon
          key={i}
          name="Star"
          size={13}
          style={{ color: i <= Math.round(n) ? "var(--p-warning)" : "var(--p-border)" }}
        />
      ))}
    </span>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  const last = parts[parts.length - 1];
  if (!first) return "··";
  return ((first[0] ?? "") + (last?.[0] ?? "")).toUpperCase();
}

export default async function MobileProfilePage() {
  const { t } = await getRequestT();
  const session = await requireSession();

  if (!hasSupabase) {
    return (
      <div className="screen screen-anim">
        <div className="scr-eye">{t("m.profile.eyebrow", undefined, "You")}</div>
        <h1 className="scr-h">{t("m.profile.title", undefined, "Profile")}</h1>
        <p className="form-intro">{t("common.configureSupabase", undefined, "Configure Supabase.")}</p>
      </div>
    );
  }

  const supabase = await createClient();
  const [
    { data: user },
    { data: profile },
    { data: social },
    { data: emergency },
    { data: travel },
    { data: uniform },
    { data: certs },
    { data: skills },
    { data: awards },
    { data: reviews },
    { data: personalDocs },
  ] = await Promise.all([
    supabase.from("users").select("id, name, email").eq("id", session.userId).maybeSingle(),
    supabase
      .from("user_profiles")
      .select("display_name, tagline, bio, pronouns, role_title, dietary_restrictions, phone, location_city, location_region, country, avatar_url")
      .eq("user_id", session.userId)
      .maybeSingle(),
    supabase.from("user_social_links").select("platform, url").eq("user_id", session.userId),
    supabase
      .from("emergency_contacts")
      .select("name, relationship, phone, priority")
      .eq("user_id", session.userId)
      .order("priority", { ascending: true }),
    supabase
      .from("user_travel_profiles")
      .select("home_airport, date_of_birth, passport_number, known_traveler_number, visas, loyalty_programs")
      .eq("user_id", session.userId)
      .maybeSingle(),
    supabase
      .from("user_uniform_sizes")
      .select("shirt, pants, shoe, glove, hat")
      .eq("user_id", session.userId)
      .maybeSingle(),
    supabase.from("user_certifications").select("name").eq("user_id", session.userId),
    supabase.from("user_skills").select("skill").eq("user_id", session.userId),
    supabase
      .from("badge_awards")
      .select("awarded_at, badge:badges(name, description, icon)")
      .eq("user_id", session.userId)
      .order("awarded_at", { ascending: false }),
    supabase
      .from("reviews")
      .select("rating, body, created_at, reviewer_user_id")
      .eq("subject_user_id", session.userId)
      .not("released_at", "is", null)
      .order("created_at", { ascending: false })
      .limit(5),
    // Kit 31 #12 — the ID & Tax step counts real personal_documents rows.
    supabase
      .from("personal_documents")
      .select("id")
      .eq("user_id", session.userId)
      .is("deleted_at", null)
      .limit(1),
  ]);

  const u = (user as { name: string | null; email: string } | null) ?? null;
  const p = profile ?? null;
  const name = u?.name ?? p?.display_name ?? t("m.profile.unnamed", undefined, "Crew Member");
  const socials = ((social ?? []) as { platform: string; url: string }[]).filter((s) => s.url);
  const ecs = (emergency ?? []) as { name: string; relationship: string | null; phone: string | null }[];
  const certList = ((certs ?? []) as { name: string }[]).map((c) => c.name);
  const skillList = ((skills ?? []) as { skill: string }[]).map((s) => s.skill);
  const dietary = (p?.dietary_restrictions ?? "")
    .split(/[·,]/)
    .map((d) => d.trim())
    .filter(Boolean);
  const badges = ((awards ?? []) as { badge: { name: string; description: string | null; icon: string | null } | null }[])
    .map((a) => a.badge)
    .filter((b): b is { name: string; description: string | null; icon: string | null } => !!b);
  const revs = (reviews ?? []) as { rating: number; body: string | null; created_at: string; reviewer_user_id: string }[];
  const hasPersonalDocs = (personalDocs ?? []).length > 0;

  // Reviewer display names (one extra query, only when there are reviews).
  const reviewerNames = new Map<string, string>();
  if (revs.length) {
    const ids = Array.from(new Set(revs.map((r) => r.reviewer_user_id)));
    const { data: reviewers } = await supabase.from("users").select("id, name").in("id", ids);
    for (const r of (reviewers ?? []) as { id: string; name: string | null }[]) {
      reviewerNames.set(r.id, r.name ?? t("m.profile.someone", undefined, "Someone"));
    }
  }
  const ratingCount = revs.length;
  const ratingAvg = ratingCount ? revs.reduce((s, r) => s + r.rating, 0) / ratingCount : 0;

  const location = [p?.location_city, p?.location_region, p?.country].filter(Boolean).join(", ");
  const shareUrl = urlFor("mobile", "/profile");

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.profile.eyebrow", undefined, "You")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.profile.title", undefined, "Profile")}
      </h1>

      {/* Identity header. */}
      <div className="item" style={{ padding: 16, alignItems: "flex-start" }}>
        <span className="avatar" style={{ width: 52, height: 52, fontSize: 17, flex: "none" }}>
          {initials(name)}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t" style={{ fontSize: 17 }}>{name}</div>
          <div className="s" style={{ marginTop: 3 }}>
            {[fmtPosition(p?.role_title) || null, p?.pronouns].filter(Boolean).join(" · ") || u?.email}
          </div>
          {p?.tagline ? <div className="s" style={{ marginTop: 2, color: "var(--p-text-2)" }}>{p.tagline}</div> : null}
        </div>
      </div>

      {/* Primary actions. Kit 31 (live-test resolution #13): Profile no
          longer links Settings — Settings is reached from More, and profile
          editing arrives with the completion stepper (resolution #12). */}
      <div style={{ display: "flex", gap: 10, margin: "8px 0 6px" }}>
        <Link href="/m/pass" className="ps-btn ps-btn--cta ps-btn--lg" style={{ flex: 1, justifyContent: "center", textDecoration: "none" }}>
          <KIcon name="QrCode" size={16} /> {t("m.profile.rose", undefined, "My Rose")}
        </Link>
      </div>

      {/* Kit 31 (live-test resolution #12): completion stepper — 8 steps
          bound to the real profile stores, % bar, and every incomplete step
          stays visible with an Add action until the profile hits 100%.
          Steps mirror the kit's STEPS list (runtime/app.jsx profile). */}
      {(() => {
        const steps: { id: string; label: string; done: boolean; href: string }[] = [
          {
            id: "photo",
            label: t("m.profile.steps.photo", undefined, "Add A Profile Photo"),
            done: !!p?.avatar_url,
            // The avatar editor lives in the personal shell's profile editor.
            href: urlFor("personal", "/me/profile"),
          },
          {
            id: "bio",
            label: t("m.profile.steps.bio", undefined, "Write A Short Bio"),
            done: !!p?.bio,
            href: "/m/settings",
          },
          {
            id: "contact",
            label: t("m.profile.steps.contact", undefined, "Add Contact Details"),
            done: !!(p?.phone && u?.email),
            href: "/m/settings",
          },
          {
            id: "emergency",
            label: t("m.profile.steps.emergency", undefined, "Add An Emergency Contact"),
            done: ecs.length > 0,
            href: "/m/settings",
          },
          {
            id: "travel",
            label: t("m.profile.steps.travel", undefined, "Complete Travel Profile"),
            done: !!travel?.passport_number,
            href: "/m/settings",
          },
          {
            id: "uniform",
            label: t("m.profile.steps.uniform", undefined, "Set Uniform Sizes"),
            done: !!uniform?.shirt,
            href: "/m/settings",
          },
          {
            id: "certs",
            label: t("m.profile.steps.certs", undefined, "Upload Certifications"),
            done: certList.length > 0,
            href: "/m/settings",
          },
          {
            id: "docs",
            label: t("m.profile.steps.docs", undefined, "Attach ID & Tax Documents"),
            done: hasPersonalDocs,
            href: "/m/documents/new",
          },
        ];
        const doneN = steps.filter((s) => s.done).length;
        if (doneN === steps.length) return null;
        const pct = Math.round((doneN / steps.length) * 100);
        return (
          <div className="item" style={{ display: "block", margin: "6px 0 4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="s" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700, color: "var(--p-text-1)" }}>
                <KIcon name="UserCheck" size={12} />
                {t("m.profile.steps.title", undefined, "Complete Your Profile")}
              </span>
              <span className="time">{pct}%</span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t("m.profile.steps.title", undefined, "Complete Your Profile")}
              style={{ height: 6, borderRadius: 999, background: "var(--p-border)", overflow: "hidden", margin: "10px 0 4px" }}
            >
              <span style={{ display: "block", height: "100%", width: `${pct}%`, background: "var(--p-accent)" }} />
            </div>
            <div className="s" style={{ marginBottom: 6 }}>
              {t(
                "m.profile.steps.summary",
                { done: doneN, total: steps.length },
                `${doneN} of ${steps.length} — a complete profile auto-imports into every project you join.`,
              )}
            </div>
            {steps
              .filter((s) => !s.done)
              .map((s) => (
                <Link
                  key={s.id}
                  href={s.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    width: "100%",
                    padding: "8px 0",
                    borderTop: "1px solid var(--p-border)",
                    color: "var(--p-text-1)",
                    textDecoration: "none",
                  }}
                >
                  <span aria-hidden="true" style={{ width: 20, height: 20, borderRadius: "50%", border: "2px dashed var(--p-border)", flex: "none" }} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{s.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--p-accent-text)" }}>
                    {t("m.profile.steps.add", undefined, "Add")}
                  </span>
                </Link>
              ))}
          </div>
        );
      })()}

      {/* About. */}
      {p?.bio ? (
        <>
          <div className="sech"><h2>{t("m.profile.about", undefined, "About")}</h2></div>
          <div className="item" style={{ display: "block" }}>
            <div className="s" style={{ lineHeight: 1.5, color: "var(--p-text-2)" }}>{p.bio}</div>
          </div>
        </>
      ) : null}

      {/* Contact. */}
      <div className="sech"><h2>{t("m.profile.contact", undefined, "Contact")}</h2></div>
      {p?.phone ? (
        <div className="item"><KIcon name="Phone" size={18} style={{ color: "var(--p-text-2)" }} /><div><div className="t">{p.phone}</div><div className="s">{t("m.profile.mobile", undefined, "Mobile")}</div></div></div>
      ) : null}
      {u?.email ? (
        <div className="item"><KIcon name="Mail" size={18} style={{ color: "var(--p-text-2)" }} /><div><div className="t">{u.email}</div><div className="s">{t("m.profile.email", undefined, "Email")}</div></div></div>
      ) : null}
      {location ? (
        <div className="item"><KIcon name="MapPin" size={18} style={{ color: "var(--p-text-2)" }} /><div><div className="t">{location}</div><div className="s">{t("m.profile.location", undefined, "Location")}</div></div></div>
      ) : null}

      {/* Emergency contacts. */}
      {ecs.length ? (
        <>
          <div className="sech"><h2>{t("m.profile.emergency", undefined, "Emergency Contacts")}</h2></div>
          {ecs.map((e, i) => (
            <div className="item" key={i}>
              <span className="more-ic"><KIcon name="LifeBuoy" size={17} /></span>
              <div><div className="t">{e.name}</div><div className="s">{[e.relationship, e.phone].filter(Boolean).join(" · ")}</div></div>
            </div>
          ))}
        </>
      ) : null}

      {/* Social. */}
      {socials.length ? (
        <>
          <div className="sech"><h2>{t("m.profile.social", undefined, "Social")}</h2></div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "0 2px" }}>
            {socials.map((s, i) => (
              <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="ps-tag" style={{ textDecoration: "none" }}>
                {s.platform}
              </a>
            ))}
          </div>
        </>
      ) : null}

      {/* Dietary. */}
      {dietary.length ? (
        <>
          <div className="sech"><h2>{t("m.profile.dietary", undefined, "Dietary")}</h2></div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "0 2px" }}>
            {dietary.map((d) => <span key={d} className="ps-tag">{d}</span>)}
          </div>
        </>
      ) : null}

      {/* Travel profile. */}
      {travel ? (
        <>
          <div className="sech"><h2>{t("m.profile.travel", undefined, "Travel Profile")}</h2></div>
          <div className="rec-grid">
            {[
              [t("m.profile.airport", undefined, "Home Airport"), travel.home_airport],
              [t("m.profile.dob", undefined, "Date of Birth"), travel.date_of_birth],
              [t("m.profile.passport", undefined, "Passport"), travel.passport_number],
              [t("m.profile.knownTraveler", undefined, "Known Traveler"), travel.known_traveler_number],
              [t("m.profile.visas", undefined, "Visas"), travel.visas],
              [t("m.profile.loyalty", undefined, "Loyalty"), travel.loyalty_programs],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div className="rec-cell" key={k}><div className="rec-k">{k}</div><div className="rec-v">{v}</div></div>
              ))}
          </div>
        </>
      ) : null}

      {/* Uniform sizes. */}
      {uniform ? (
        <>
          <div className="sech"><h2>{t("m.profile.uniform", undefined, "Uniform Sizes")}</h2></div>
          <div className="rec-grid">
            {[
              [t("m.profile.shirt", undefined, "Shirt"), uniform.shirt],
              [t("m.profile.pants", undefined, "Pants"), uniform.pants],
              [t("m.profile.shoe", undefined, "Shoe"), uniform.shoe],
              [t("m.profile.glove", undefined, "Glove"), uniform.glove],
              [t("m.profile.hat", undefined, "Hat"), uniform.hat],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div className="rec-cell" key={k}><div className="rec-k">{k}</div><div className="rec-v">{v}</div></div>
              ))}
          </div>
        </>
      ) : null}

      {/* Badges. */}
      {badges.length ? (
        <>
          <div className="sech"><h2>{t("m.profile.badges", undefined, "Badges")}</h2></div>
          <div className="badge-grid">
            {badges.map((b, i) => (
              <div className="badge-card" key={i}>
                <span className="badge-ic"><KIcon name={b.icon || "Award"} size={20} /></span>
                <div className="badge-name">{b.name}</div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {/* Certifications. */}
      {certList.length ? (
        <>
          <div className="sech"><h2>{t("m.profile.certs", undefined, "Certifications")}</h2></div>
          {certList.map((c, i) => (
            <div className="item" key={i}><span className="more-ic"><KIcon name="Award" size={17} /></span><div><div className="t">{c}</div></div></div>
          ))}
        </>
      ) : null}

      {/* Skills & tags. */}
      {skillList.length ? (
        <>
          <div className="sech"><h2>{t("m.profile.skills", undefined, "Skills & Tags")}</h2></div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "0 2px" }}>
            {skillList.map((s) => <span key={s} className="ps-tag">{s}</span>)}
          </div>
        </>
      ) : null}

      {/* Ratings & reviews. */}
      {ratingCount ? (
        <>
          <div className="sech"><h2>{t("m.profile.ratings", undefined, "Ratings & Reviews")}</h2></div>
          <div className="item" style={{ alignItems: "center" }}>
            <div style={{ textAlign: "center", flex: "none" }}>
              <div style={{ fontFamily: "var(--p-heading)", fontSize: 28, lineHeight: 1 }}>{ratingAvg.toFixed(1)}</div>
              <div className="s">{t("m.profile.reviewCount", { count: ratingCount }, `${ratingCount} reviews`)}</div>
            </div>
            <div style={{ flex: 1, paddingLeft: 14 }}><Stars n={ratingAvg} /></div>
          </div>
          {revs.map((r, i) => (
            <div className="item" key={i} style={{ display: "block" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <div className="t">{reviewerNames.get(r.reviewer_user_id) ?? t("m.profile.someone", undefined, "Someone")}</div>
                <span className="sp" />
                <Stars n={r.rating} />
              </div>
              {r.body ? <div className="s" style={{ lineHeight: 1.45 }}>{r.body}</div> : null}
            </div>
          ))}
        </>
      ) : null}

      <ShareProfileButton url={shareUrl} name={name} label={t("m.profile.share", undefined, "Share Profile")} />
    </div>
  );
}
