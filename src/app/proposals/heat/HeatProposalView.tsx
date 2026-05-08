"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  HEAT_DOC,
  HEAT_LIFECYCLE,
  HEAT_PHASE_DEADLINES,
  HEAT_CADENCE_RUNWAY,
  HEAT_SITES,
  HEAT_TAXONOMY,
  HEAT_TIERS,
  HEAT_EXCLUSIONS,
  HEAT_TERMS,
  HEAT_CHANGE_ORDERS,
  HEAT_RETAINER_TIERS,
  HEAT_ADDONS,
  ADDON_CATEGORY_LABELS,
  type AddonCategory,
  type TierId,
  fmtMoney,
  fmtRange,
} from "./data";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "builds", label: "Builds" },
  { id: "retainer", label: "Retainer" },
  { id: "scope", label: "Scope" },
  { id: "lifecycle", label: "Lifecycle" },
  { id: "investment", label: "Investment" },
  { id: "addons", label: "Add-Ons" },
  { id: "sign", label: "Sign" },
];

export function HeatProposalView() {
  return (
    <div className="heat-doc">
      <HeatNav />
      <Hero />
      <ProjectOverview />
      <ActivationTiers />
      <RetainerTiers />
      <ScopeOfWork />
      <ActivationSites />
      <LifecycleAndWorkback />
      <InvestmentSummary />
      <PaymentMethod />
      <Addons />
      <ChangeOrders />
      <Exclusions />
      <Terms />
      <Authorization />
      <Footer />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Sticky Nav with active-section highlight
// ─────────────────────────────────────────────────────────────────────────
function HeatNav() {
  const [active, setActive] = useState<string>("overview");

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (!el) return;
      const o = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) setActive(s.id);
          });
        },
        { rootMargin: "-30% 0px -60% 0px" },
      );
      o.observe(el);
      observers.push(o);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <nav className="heat-nav print-hide">
      <div className="heat-nav-inner">
        <span className="heat-nav-brand" aria-label="AGV Miami x Miami HEAT">
          AGV Miami <span className="heat-x">×</span> <span className="heat-wordmark">HEAT</span>
        </span>
        <div className="heat-nav-links" aria-label="Section navigation">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className={active === s.id ? "active" : ""}>
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section id="overview" className="heat-hero">
      <div className="heat-hero-inner">
        <span className="heat-eyebrow">
          <span className="heat-flame" aria-hidden="true" />
          Pop-Up Activation Program · {HEAT_DOC.programWindow}
        </span>
        <h1>
          <span className="heat-italic">Miami</span> <span className="heat-italic heat-red">HEAT</span>
          <span className="heat-line2 heat-italic">East Plaza Activations</span>
        </h1>
        <p className="heat-sub" style={{ marginTop: 28 }}>
          A retained activation studio for the East Plaza inside Kaseya Center — concept, engineering, fabrication,
          install, and strike across a tiered menu of pop-up moments calibrated to partner unlocks, homestand rhythm,
          and signature plaza takeovers.
        </p>
        <dl className="heat-hero-meta">
          <Meta label="Client" value={HEAT_DOC.client} />
          <Meta label="Producer" value={HEAT_DOC.producerLong} />
          <Meta label="Venue" value={HEAT_DOC.venue} />
          <Meta label="Document" value={`${HEAT_DOC.docNumber} · ${HEAT_DOC.version}`} />
        </dl>
        <div className="heat-confidential">
          Confidential · Prepared for {HEAT_DOC.contactClient} at Miami HEAT · {HEAT_DOC.validity}
        </div>
      </div>
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Section heading helper
// ─────────────────────────────────────────────────────────────────────────
function SectionHeader({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <>
      <div className="heat-section-eyebrow">
        <span />
        <span>{eyebrow}</span>
      </div>
      <h2 className="heat-h2">{title}</h2>
      {sub && <p className="heat-sub">{sub}</p>}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Project Overview — engagement summary cards
// ─────────────────────────────────────────────────────────────────────────
function ProjectOverview() {
  return (
    <section className="heat-section">
      <SectionHeader
        eyebrow="Project Overview"
        title="Tiered Builds. Retained Capacity."
        sub="Three engagement vectors, designed to compound. Each activation pulls from a tiered build menu. A monthly retainer (pick one of three tiers) holds dedicated studio capacity behind the program. Add-Ons stack onto either, on demand."
      />
      <div className="heat-grid-3" style={{ marginTop: 24 }}>
        <div className="heat-card">
          <span className="heat-card-accent" />
          <div className="heat-eyebrow">Per Activation</div>
          <h3 style={{ fontSize: 22, marginTop: 8 }}>Build Menu</h3>
          <dl style={{ marginTop: 12 }}>
            <Detail label="Small" value={fmtRange(HEAT_TIERS[0].base, HEAT_TIERS[0].ceiling)} />
            <Detail label="Medium" value={fmtRange(HEAT_TIERS[1].base, HEAT_TIERS[1].ceiling)} />
            <Detail label="Large" value={fmtRange(HEAT_TIERS[2].base, HEAT_TIERS[2].ceiling)} />
            <Detail label="Includes" value="Production · Fab · Install · Strike" />
          </dl>
        </div>
        <div className="heat-card">
          <span className="heat-card-accent" style={{ background: "var(--heat-yellow)" }} />
          <div className="heat-eyebrow" style={{ color: "var(--heat-yellow)" }}>
            Retainer
          </div>
          <h3 style={{ fontSize: 22, marginTop: 8 }}>Three Tiers</h3>
          <dl style={{ marginTop: 12 }}>
            <Detail label="Base" value={`${fmtMoney(HEAT_RETAINER_TIERS[0].price)} / mo`} />
            <Detail label="Elevated" value={`${fmtMoney(HEAT_RETAINER_TIERS[1].price)} / mo`} />
            <Detail label="Premium" value={`${fmtMoney(HEAT_RETAINER_TIERS[2].price)} / mo`} />
            <Detail label="Commitment" value={HEAT_DOC.retainerCommitment} />
          </dl>
        </div>
        <div className="heat-card">
          <span className="heat-card-accent" style={{ background: "var(--heat-black)" }} />
          <div className="heat-eyebrow" style={{ color: "var(--heat-black)" }}>
            Upgrades
          </div>
          <h3 style={{ fontSize: 22, marginTop: 8 }}>Optional Upgrades</h3>
          <dl style={{ marginTop: 12 }}>
            <Detail label="Add-On Menu" value={`${HEAT_ADDONS.length} Items · 5 Categories`} />
            <Detail label="Adds To" value="Retainer · Activation · Both" />
            <Detail label="Build Discount" value="Up To 12% Off List" />
            <Detail label="Asset Reuse" value="30–50% Credit On Re-Deployment" />
          </dl>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Retainer Tiers — Base / Elevated / Premium comparison cards
// ─────────────────────────────────────────────────────────────────────────
function RetainerTiers() {
  const upsellLabel: Record<string, string> = {
    base: "Need More? See Elevated →",
    elevated: "Need More? See Premium →",
  };
  const premium = HEAT_RETAINER_TIERS.find((t) => t.id === "premium");

  return (
    <section id="retainer" className="heat-section">
      <SectionHeader
        eyebrow="Retainer Tiers"
        title="Base. Elevated. Premium."
        sub="Three retainer tiers, scaled to your activation cadence. Each tier builds on the last — Elevated includes everything in Base, and Premium includes everything in Elevated plus exclusive lines reserved for the top tier."
      />
      <div className="heat-retainer-grid" style={{ marginTop: 28 }}>
        {HEAT_RETAINER_TIERS.map((tier) => {
          const flagship = tier.id === "premium";
          return (
            <article key={tier.id} className={flagship ? "heat-retainer-card flagship" : "heat-retainer-card"}>
              <header className="heat-retainer-head">
                <span className="heat-tier-num">{tier.num}</span>
                <div>
                  <div className="heat-tier-name">{tier.name}</div>
                  <div className="heat-tier-meta">{tier.pitch}</div>
                </div>
              </header>
              <div className="heat-retainer-price">
                <span className="heat-mono heat-retainer-price-eyebrow">Monthly</span>
                <strong>{fmtMoney(tier.price)}</strong>
                <span className="heat-mono heat-retainer-price-annual">· {fmtMoney(tier.price * 12)} / yr</span>
              </div>
              <p className="heat-retainer-fitfor">
                <span className="heat-eyebrow">Fit For</span>
                {tier.fitFor}
              </p>
              <ul className="heat-retainer-features">
                {tier.features.map((f) => (
                  <li key={f.name}>
                    <span />
                    <div>
                      <div className="heat-name">{f.name}</div>
                      <div className="heat-desc">{f.detail}</div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="heat-retainer-cta">
                <a href="#sign" className={flagship ? "heat-btn danger" : "heat-btn"} data-tier-cta={tier.id}>
                  Choose {tier.name}
                </a>
                {upsellLabel[tier.id] && (
                  <a
                    href={tier.id === "base" ? "#retainer" : "#retainer"}
                    className="heat-retainer-upsell"
                    data-upsell-from={tier.id}
                  >
                    {upsellLabel[tier.id]}
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {premium?.exclusive && premium.exclusive.length > 0 && (
        <div className="heat-premium-banner" aria-labelledby="premium-banner-title">
          <div className="heat-premium-banner-head">
            <span className="heat-flame" aria-hidden="true" />
            <span id="premium-banner-title" className="heat-premium-banner-eyebrow">
              Premium Exclusives · Reserved For The Top Tier
            </span>
          </div>
          <h3 className="heat-premium-banner-title">Lines You Won't Find Anywhere Else.</h3>
          <p className="heat-premium-banner-sub">
            Four lines available only at the Premium tier — not à la carte, not on Elevated, not as a one-off buy.
            Reserved for partners running a season-defining program with us.
          </p>
          <ul className="heat-premium-banner-grid">
            {premium.exclusive.map((f) => (
              <li key={f.name}>
                <div className="heat-name">{f.name}</div>
                <div className="heat-desc">{f.detail}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        borderBottom: "1px dashed var(--heat-line)",
        padding: "6px 0",
        fontSize: 12.5,
      }}
    >
      <dt
        style={{
          color: "var(--heat-muted)",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontSize: 10,
        }}
      >
        {label}
      </dt>
      <dd style={{ margin: 0, fontFamily: "var(--font-mono, monospace)", textAlign: "right" }}>{value}</dd>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Activation Tiers — Small / Medium / Large with accordions
// ─────────────────────────────────────────────────────────────────────────
function ActivationTiers() {
  const [open, setOpen] = useState<Record<string, boolean>>({
    small: true,
    medium: false,
    large: false,
  });

  return (
    <section id="builds" className="heat-section">
      <SectionHeader
        eyebrow="Activation Builds"
        title="Small. Medium. Large."
        sub="Three build tiers, calibrated for the moment. Each tier holds a tight range from base spec to top spec, with larger architectural and retail moves quoted separately from the Add-Ons menu."
      />
      <div style={{ marginTop: 28 }}>
        {HEAT_TIERS.map((tier) => {
          const isOpen = !!open[tier.id];
          return (
            <article key={tier.id} className="heat-tier" data-open={isOpen}>
              <button
                type="button"
                className="heat-tier-head"
                onClick={() => setOpen((o) => ({ ...o, [tier.id]: !o[tier.id] }))}
                aria-expanded={isOpen}
              >
                <span className="heat-tier-num">{tier.num}</span>
                <span>
                  <span className="heat-tier-name">{tier.name}</span>
                  <span className="heat-tier-meta" style={{ display: "block" }}>
                    {tier.size} · {tier.duration}
                  </span>
                </span>
                <span className="heat-tier-price">
                  Build Range
                  <strong>{fmtRange(tier.base, tier.ceiling)}</strong>
                </span>
                <span className="heat-tier-toggle" aria-hidden="true">
                  +
                </span>
              </button>
              <div className="heat-tier-body">
                <p className="heat-tier-narrative">{tier.narrative}</p>
                {tier.precedents.length > 0 && (
                  <div className="heat-tier-precedents">
                    {tier.precedents.map((p) => (
                      <span key={p} className="heat-pill">
                        Precedent · {p}
                      </span>
                    ))}
                  </div>
                )}
                <div className="heat-tier-section-title">Included In Base · {fmtMoney(tier.base)}</div>
                <ul className="heat-tier-list">
                  {tier.included.map((it) => (
                    <li key={it.name}>
                      <span />
                      <div>
                        <div className="heat-name">{it.name}</div>
                        <div className="heat-desc">{it.desc}</div>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="heat-tier-section-title" style={{ color: "var(--heat-yellow)" }}>
                  Upgrades In This Tier · Up To {fmtMoney(tier.ceiling)}
                </div>
                <ul className="heat-tier-list">
                  {tier.customization.map((it) => (
                    <li key={it.name} data-customization="true">
                      <span />
                      <div>
                        <div className="heat-name">{it.name}</div>
                        <div className="heat-desc">{it.desc}</div>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="heat-tier-footnote">
                  Larger architectural moves — chemetal cladding, container architecture, full POS retail, hospitality
                  builds — are quoted separately from the <a href="#addons">Add-Ons menu</a> and layered onto whichever
                  tier suits the moment.
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Scope of Work — 11-node taxonomy
// ─────────────────────────────────────────────────────────────────────────
function ScopeOfWork() {
  const components = HEAT_TAXONOMY.filter((n) => n.kind === "Components");
  const services = HEAT_TAXONOMY.filter((n) => n.kind === "Services");

  return (
    <section id="scope" className="heat-section">
      <SectionHeader
        eyebrow="Scope of Work"
        title="Drawn. Built. Printed. Installed."
        sub="Eleven scope nodes covering every fabricated and printed element plus the production services that move it from shop to plaza and back. Tier defines breadth and finish — not which nodes are touched."
      />
      <div className="heat-grid-2" style={{ marginTop: 24 }}>
        <ScopeColumn title="Fabrication & Print" nodes={components} />
        <ScopeColumn title="Production Services" nodes={services} />
      </div>
    </section>
  );
}

function ScopeColumn({ title, nodes }: { title: string; nodes: typeof HEAT_TAXONOMY }) {
  return (
    <div>
      <div className="heat-eyebrow" style={{ marginBottom: 12 }}>
        {title}
      </div>
      {nodes.map((n) => (
        <details key={n.id} className="heat-card" style={{ marginBottom: 10, padding: "16px 20px" }}>
          <summary
            style={{
              cursor: "pointer",
              listStyle: "none",
              display: "flex",
              alignItems: "baseline",
              gap: 14,
            }}
          >
            <span className="heat-mono" style={{ color: "var(--heat-red)", fontSize: 18 }}>
              {n.num}
            </span>
            <span style={{ flex: 1 }}>
              <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: "0.02em" }}>{n.name}</span>
              <span
                style={{
                  display: "block",
                  fontSize: 11,
                  color: "var(--heat-muted)",
                  marginTop: 2,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                {n.sub}
              </span>
            </span>
            <span aria-hidden="true" className="heat-mono" style={{ color: "var(--heat-muted)" }}>
              +
            </span>
          </summary>
          <p style={{ fontSize: 13, color: "var(--heat-muted)", marginTop: 10, lineHeight: 1.6 }}>{n.narrative}</p>
          <div
            style={{
              marginTop: 8,
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--heat-red)",
              fontWeight: 700,
            }}
          >
            Applies To · {n.appliesTo.map((t) => t.toUpperCase()).join(" · ")}
          </div>
        </details>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Activation Sites — East Plaza zoning
// ─────────────────────────────────────────────────────────────────────────
function ActivationSites() {
  return (
    <section id="sites" className="heat-section">
      <SectionHeader
        eyebrow="Activation Sites"
        title="Where Every Element Lands."
        sub="Three zones across the East Plaza. Each accommodates a different tier and dwell pattern; treatment scales with the moment."
      />
      <div className="heat-grid-3" style={{ marginTop: 24 }}>
        {HEAT_SITES.map((s) => (
          <div key={s.tag} className="heat-card">
            <span className="heat-card-accent" />
            <div className="heat-eyebrow">Site · {s.tag}</div>
            <h3 style={{ fontSize: 22, marginTop: 8 }}>{s.name}</h3>
            <p style={{ fontSize: 13.5, color: "var(--heat-muted)", marginTop: 10, lineHeight: 1.6 }}>{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 8-Phase Production Lifecycle
// ─────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────
// Production Lifecycle + Workback Schedule — single parent owns the
// cadence selection so the toggle drives both the phase cards and the
// workback table in lockstep.
// ─────────────────────────────────────────────────────────────────────────
const CADENCE_OPTIONS: { id: TierId; label: string }[] = [
  { id: "small", label: "Small Cadence" },
  { id: "medium", label: "Medium Cadence" },
  { id: "large", label: "Large Cadence" },
];

function LifecycleAndWorkback() {
  const [cadence, setCadence] = useState<TierId>("medium");
  const deadlines = HEAT_PHASE_DEADLINES[cadence];

  return (
    <>
      <ProductionLifecycle cadence={cadence} setCadence={setCadence} deadlines={deadlines} />
      <WorkbackSchedule cadence={cadence} deadlines={deadlines} />
    </>
  );
}

function ProductionLifecycle({
  cadence,
  setCadence,
  deadlines,
}: {
  cadence: TierId;
  setCadence: (c: TierId) => void;
  deadlines: Record<string, string>;
}) {
  return (
    <section id="lifecycle" className="heat-section">
      <SectionHeader
        eyebrow="Production Lifecycle"
        title="From Brief To Strike."
        sub="Eight phases, identical structure across every activation. The runway scales with build tier — Small condenses to five weeks, Medium runs nine, Large stretches to thirteen."
      />
      <div className="heat-cadence-toggle print-hide" role="tablist" aria-label="Cadence">
        {CADENCE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={cadence === opt.id}
            onClick={() => setCadence(opt.id)}
            className="heat-mono"
            data-active={cadence === opt.id}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 20 }}>
        {HEAT_LIFECYCLE.map((p) => (
          <div key={p.id} className="heat-phase">
            <div className="heat-phase-head">
              <span className="heat-phase-num">{p.num}</span>
              <span className="heat-phase-name">{p.name}</span>
              <span className="heat-phase-deadline">{deadlines[p.id]}</span>
            </div>
            <p className="heat-phase-intent">{p.intent}</p>
            <div className="heat-phase-grid">
              <div>
                <h4>Milestones</h4>
                <ul>
                  {p.milestones.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>Deliverables</h4>
                <ul>
                  {p.deliverables.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>Approval Gate</h4>
                <p style={{ fontSize: 12.5, color: "var(--heat-muted)", margin: 0, lineHeight: 1.55 }}>{p.gate}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function WorkbackSchedule({ cadence, deadlines }: { cadence: TierId; deadlines: Record<string, string> }) {
  const rows = HEAT_LIFECYCLE.flatMap((p) =>
    p.milestones.slice(0, 2).map((m) => ({
      phase: p.name,
      milestone: m,
      deadline: deadlines[p.id],
    })),
  );
  const tierLabel = cadence.charAt(0).toUpperCase() + cadence.slice(1);
  return (
    <section className="heat-section">
      <SectionHeader
        eyebrow={`Workback Schedule · ${HEAT_CADENCE_RUNWAY[cadence]}`}
        title="Calibrated Against Activation Date."
        sub={`Every deadline counts back from the activation date for a ${tierLabel} build. Toggle the cadence above to see how Small, Medium, and Large compare.`}
      />
      <div className="heat-investment" style={{ marginTop: 20 }}>
        <table>
          <thead>
            <tr>
              <th>Phase</th>
              <th>Milestone</th>
              <th className="right">Deadline</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600, fontSize: 13 }}>{r.phase}</td>
                <td style={{ fontSize: 13, color: "var(--heat-muted)" }}>{r.milestone}</td>
                <td className="right" style={{ fontSize: 12 }}>
                  {r.deadline}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Investment Summary — retainer + per-activation tier ranges
// ─────────────────────────────────────────────────────────────────────────
function InvestmentSummary() {
  return (
    <section id="investment" className="heat-section">
      <SectionHeader
        eyebrow="Investment Summary"
        title="Build Plus Retainer."
        sub="Total program investment scales with your activation cadence and retainer tier. Pick builds off the menu, choose a retainer to hold studio capacity behind the program, and layer in the upgrades that fit the moment. Every figure covers production, fabrication, install, and strike."
      />
      <div className="heat-investment" style={{ marginTop: 20 }}>
        <table>
          <tbody>
            <tr className="heat-row-section">
              <td>Per-Activation Build</td>
              <td className="right">Range · Base To Top Spec</td>
            </tr>
            {HEAT_TIERS.map((t) => (
              <tr key={t.id}>
                <td>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name} Build</div>
                  <div style={{ fontSize: 12, color: "var(--heat-muted)", marginTop: 2 }}>{t.size}</div>
                </td>
                <td className="right">{fmtRange(t.base, t.ceiling)}</td>
              </tr>
            ))}

            <tr className="heat-row-section">
              <td>Retainer Tier (Pick One)</td>
              <td className="right">Monthly · Annual</td>
            </tr>
            {HEAT_RETAINER_TIERS.map((rt) => (
              <tr key={rt.id}>
                <td>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {rt.name} Retainer · {rt.pitch}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--heat-muted)", marginTop: 2 }}>{rt.fitFor}</div>
                </td>
                <td className="right">
                  {fmtMoney(rt.price)}
                  <span style={{ color: "var(--heat-muted)" }}> / mo</span>
                  <div style={{ fontSize: 11, color: "var(--heat-muted)" }}>{fmtMoney(rt.price * 12)} / yr</div>
                </td>
              </tr>
            ))}

            <tr className="heat-row-section">
              <td>Add-Ons & Upgrades</td>
              <td className="right">Add To Any Tier</td>
            </tr>
            <tr>
              <td>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{HEAT_ADDONS.length} menu items across 5 categories</div>
                <div style={{ fontSize: 12, color: "var(--heat-muted)", marginTop: 2 }}>
                  Material & Finish · Functional Upgrades · Service Overlays · Logistics · Documentation. Add any number
                  to any retainer or activation.
                </div>
              </td>
              <td className="right">Priced By Request</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td>Program Investment</td>
              <td className="right">Retainer + Build + Add-Ons</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p style={{ fontSize: 11.5, color: "var(--heat-muted)", marginTop: 12 }}>
        Every activation runs under its own signed sign-off, layered into this master agreement. Each build tier holds a
        tight range from base spec to top spec, and upgrades inside that range stay inside the tier. Larger
        architectural moves are quoted separately from the Add-Ons menu.
      </p>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Add-Ons & Upgrades — full overlay catalog grouped by category
// ─────────────────────────────────────────────────────────────────────────
function Addons() {
  const grouped = useMemo(() => {
    const order: AddonCategory[] = ["material", "functional", "service", "logistics", "documentation"];
    return order.map((cat) => ({
      cat,
      items: HEAT_ADDONS.filter((a) => a.category === cat),
    }));
  }, []);

  return (
    <section id="addons" className="heat-section">
      <SectionHeader
        eyebrow="Add-Ons & Upgrades"
        title="Stack Anything. On Anything."
        sub="The full menu of optional upgrades — material, functional, service, logistics, and documentation. Pick any item, add it to any retainer or any build. Priced by request."
      />
      <div style={{ marginTop: 24, display: "grid", gap: 28 }}>
        {grouped.map(({ cat, items }) => (
          <div key={cat}>
            <div className="heat-addon-cat-head">
              <span className="heat-flame" aria-hidden="true" />
              <span>{ADDON_CATEGORY_LABELS[cat]}</span>
              <span className="heat-mono heat-addon-count">{items.length} items</span>
            </div>
            <div className="heat-grid-2" style={{ marginTop: 12 }}>
              {items.map((a) => (
                <div key={a.id} className="heat-addon-card">
                  <div className="heat-addon-card-head">
                    <div className="heat-addon-name">{a.name}</div>
                    <span className="heat-pill heat-addon-applies">
                      {a.appliesTo === "both"
                        ? "Retainer + Activation"
                        : a.appliesTo === "retainer"
                          ? "Retainer"
                          : "Activation"}
                    </span>
                  </div>
                  <div className="heat-addon-body">{a.body}</div>
                  <div className="heat-addon-foot">
                    <span className="heat-mono heat-addon-price">{a.price}</span>
                    {a.tierMin && (
                      <span className="heat-addon-min">
                        Min Tier · {a.tierMin.charAt(0).toUpperCase() + a.tierMin.slice(1)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Engagement Bar + Payment Method
// ─────────────────────────────────────────────────────────────────────────
function PaymentMethod() {
  return (
    <section className="heat-section">
      <div className="heat-engagement">
        <div className="heat-card">
          <span className="heat-card-accent" />
          <div className="heat-eyebrow">Activation Deposit</div>
          <div className="heat-engagement-pct">{HEAT_DOC.paymentDepositPct}%</div>
          <div style={{ marginTop: 8, fontSize: 12, color: "rgba(250, 247, 242, 0.7)" }}>
            Due on written approval of each activation Statement of Work.
          </div>
        </div>
        <div className="heat-card balance">
          <span className="heat-card-accent" style={{ background: "var(--heat-black)" }} />
          <div className="heat-eyebrow">Balance</div>
          <div className="heat-engagement-pct">{HEAT_DOC.paymentBalancePct}%</div>
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--heat-muted)" }}>
            Due five (5) business days prior to load-in. Retainer billed separately, monthly net-15.
          </div>
        </div>
      </div>
      <div className="heat-card" style={{ marginTop: 16 }}>
        <div className="heat-eyebrow">Payment Method · ACH / Wire</div>
        <div
          style={{
            display: "grid",
            gap: 8,
            marginTop: 10,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            fontSize: 13,
          }}
        >
          <Detail label="Payable To" value="AGV Miami" />
          <Detail label="Reference" value={HEAT_DOC.docNumber} />
          <Detail label="ACH / Wire" value="Banking detail issued with executed contract" />
          <Detail label="Currency" value="USD" />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Change Orders — commercial mechanics
// ─────────────────────────────────────────────────────────────────────────
function ChangeOrders() {
  return (
    <section className="heat-section">
      <SectionHeader
        eyebrow="Optional Scope"
        title="Available Change Orders."
        sub="Scope outside the base tier menu — issued individually or stacked into a single activation SOW."
      />
      <div className="heat-grid-2" style={{ marginTop: 24 }}>
        {HEAT_CHANGE_ORDERS.map((c) => (
          <div
            key={c.name}
            style={{
              border: "1px dashed var(--heat-line-strong)",
              padding: 18,
              borderRadius: 4,
              background: "rgba(255,255,255,0.5)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{c.name}</div>
              <span className="heat-pill">Available</span>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--heat-muted)", marginTop: 8, lineHeight: 1.55 }}>{c.body}</div>
            <div className="heat-mono" style={{ fontSize: 12, marginTop: 10 }}>
              {c.price}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Exclusions
// ─────────────────────────────────────────────────────────────────────────
function Exclusions() {
  return (
    <section className="heat-section">
      <SectionHeader eyebrow="Scope Boundaries" title="Outside This Engagement." />
      <ul style={{ marginTop: 20, paddingLeft: 0, listStyle: "none" }}>
        {HEAT_EXCLUSIONS.map((e) => (
          <li
            key={e.term}
            style={{
              fontSize: 13.5,
              color: "var(--heat-muted)",
              padding: "10px 0",
              borderBottom: "1px dashed var(--heat-line)",
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: "var(--heat-ink)" }}>{e.term}.</strong> {e.body}
          </li>
        ))}
      </ul>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Terms
// ─────────────────────────────────────────────────────────────────────────
function Terms() {
  return (
    <section id="terms" className="heat-section">
      <SectionHeader eyebrow="Terms & Conditions" title="The Operating Agreement." />
      <div className="heat-grid-2" style={{ marginTop: 24 }}>
        {HEAT_TERMS.map((t) => (
          <div key={t.section} className="heat-card">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                className="heat-mono"
                style={{
                  background: "var(--heat-ink)",
                  color: "var(--heat-paper)",
                  padding: "2px 8px",
                  borderRadius: 999,
                  fontSize: 11,
                }}
              >
                {t.section}
              </span>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{t.title}</span>
            </div>
            <p style={{ fontSize: 12.5, color: "var(--heat-muted)", marginTop: 10, lineHeight: 1.6 }}>{t.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Authorization — signature pad with Draw / Type tabs + execution receipt
// ─────────────────────────────────────────────────────────────────────────
function Authorization() {
  const [mode, setMode] = useState<"draw" | "type">("draw");
  const [typedName, setTypedName] = useState("");
  const [signerName, setSignerName] = useState("");
  const [signerTitle, setSignerTitle] = useState("");
  const [signed, setSigned] = useState(false);
  const [signedAt, setSignedAt] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const hasInkRef = useRef(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * ratio;
    c.height = rect.height * ratio;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0a0a0a";
  }, [mode]);

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current;
    if (!c) return;
    c.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const rect = c.getBoundingClientRect();
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    hasInkRef.current = true;
  };

  const endDraw = () => {
    drawingRef.current = false;
  };

  const clearCanvas = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    hasInkRef.current = false;
  };

  const canSign = useMemo(() => {
    if (!signerName.trim()) return false;
    if (mode === "type") return typedName.trim().length > 0;
    return hasInkRef.current; // best-effort flag
  }, [mode, signerName, typedName]);

  const execute = () => {
    if (!canSign) {
      alert("Add your signature and printed name to execute.");
      return;
    }
    setSigned(true);
    setSignedAt(new Date().toISOString());
  };

  return (
    <section id="sign" className="heat-section">
      <SectionHeader
        eyebrow="Authorization"
        title="Execute The Master Agreement."
        sub="Signing here authorizes the baseline retainer and entitles HEAT to call activations off the tier menu under individual SOWs. Per-activation signatures live in each SOW."
      />
      <div className="heat-sig-card" style={{ marginTop: 24 }}>
        <div className="heat-sig-tabs print-hide" role="tablist">
          <button role="tab" type="button" data-active={mode === "draw"} onClick={() => setMode("draw")}>
            Draw
          </button>
          <button role="tab" type="button" data-active={mode === "type"} onClick={() => setMode("type")}>
            Type
          </button>
        </div>

        {mode === "draw" ? (
          <canvas
            ref={canvasRef}
            className="heat-sig-canvas"
            onPointerDown={startDraw}
            onPointerMove={draw}
            onPointerUp={endDraw}
            onPointerLeave={endDraw}
            aria-label="Draw your signature"
          />
        ) : (
          <div>
            <input
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="Type your full legal name"
              className="heat-input"
              style={{ maxWidth: 540 }}
              aria-label="Typed signature"
            />
            <div className="heat-sig-typed" aria-hidden="true">
              {typedName || " "}
            </div>
          </div>
        )}

        <div className="heat-sig-fields">
          <input
            className="heat-input"
            placeholder="Printed name"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            aria-label="Printed name"
          />
          <input
            className="heat-input"
            placeholder="Title"
            value={signerTitle}
            onChange={(e) => setSignerTitle(e.target.value)}
            aria-label="Title"
          />
        </div>

        <div className="heat-cta-row">
          <button type="button" className="heat-btn" disabled={signed} onClick={execute}>
            {signed ? "Executed" : "Execute Agreement"}
          </button>
          {mode === "draw" && (
            <button type="button" className="heat-btn secondary" onClick={clearCanvas} disabled={signed}>
              Clear
            </button>
          )}
        </div>

        {signed && signedAt && (
          <div
            style={{
              marginTop: 16,
              padding: 14,
              background: "rgba(152, 0, 46, 0.06)",
              borderLeft: "3px solid var(--heat-red)",
              fontSize: 12.5,
            }}
          >
            <div className="heat-eyebrow">Execution Receipt</div>
            <div style={{ marginTop: 6, color: "var(--heat-ink)" }}>
              <div>
                Executed by <strong>{signerName}</strong>
                {signerTitle ? `, ${signerTitle}` : ""}
              </div>
              <div className="heat-mono" style={{ fontSize: 11.5, color: "var(--heat-muted)" }}>
                {signedAt} · Document {HEAT_DOC.docNumber} · {HEAT_DOC.version}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="heat-cta-row print-hide" style={{ marginTop: 28 }}>
        <a className="heat-btn danger" href={`mailto:${HEAT_DOC.contactProducer}?subject=HEAT%20Activation%20Program`}>
          Email The Producer
        </a>
        <button type="button" className="heat-btn secondary" onClick={() => window.print()}>
          Print / Save PDF
        </button>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="heat-footer">
      <div className="heat-footer-inner">
        <div>
          <h4>Producer</h4>
          <div style={{ fontSize: 18, fontFamily: "var(--font-display, Anton)", letterSpacing: "0.05em" }}>
            {HEAT_DOC.producerLong}
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>{HEAT_DOC.contactProducer}</div>
        </div>
        <div>
          <h4>Project</h4>
          <div className="heat-mono" style={{ fontSize: 13 }}>
            {HEAT_DOC.docNumber}
            <br />
            {HEAT_DOC.version}
          </div>
        </div>
        <div>
          <h4>Confidential</h4>
          <div style={{ fontSize: 12, opacity: 0.7, lineHeight: 1.6 }}>
            Prepared for {HEAT_DOC.client}. Pricing and structural detail are confidential between the parties. ©{" "}
            {new Date().getFullYear()} {HEAT_DOC.producerLong}.
          </div>
        </div>
      </div>
    </footer>
  );
}
