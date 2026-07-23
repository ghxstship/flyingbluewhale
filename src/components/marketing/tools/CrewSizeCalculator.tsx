"use client";

import { useMemo, useState } from "react";
import { useFormatters } from "@/lib/i18n/LocaleProvider";

/**
 * Crew size estimator. Every ratio here is a MODELED rule of thumb, not a
 * code requirement: the 1:100 security baseline slides by event risk profile
 * the same way the XMCE rulebase parameterizes it. No figure below is a
 * verbatim citation from any statute.
 */
const EVENT_TYPES: Array<{
  slug: string;
  label: string;
  securityRatio: number;
  stewardRatio: number;
  hint: string;
}> = [
  {
    slug: "concert",
    label: "Concert / live music",
    securityRatio: 100,
    stewardRatio: 150,
    hint: "Single stage, ticketed, standard risk. MODELED 1 security per 100 attendees.",
  },
  {
    slug: "festival",
    label: "Festival / multi-stage",
    securityRatio: 75,
    stewardRatio: 100,
    hint: "Multi-stage, long duration, alcohol likely. MODELED 1 security per 75 attendees.",
  },
  {
    slug: "corporate",
    label: "Corporate / conference",
    securityRatio: 250,
    stewardRatio: 300,
    hint: "Seated, credentialed, low risk. MODELED 1 security per 250 attendees.",
  },
  {
    slug: "sports",
    label: "Sports / arena",
    securityRatio: 125,
    stewardRatio: 200,
    hint: "Fixed seating, rival-crowd dynamics. MODELED 1 security per 125 attendees.",
  },
];

function medicalTier(attendance: number): { tier: string; firstAiders: number; extras: string } {
  const perThousand = Math.ceil(attendance / 1000) * 2;
  if (attendance < 1000) {
    return {
      tier: "Basic first aid",
      firstAiders: 2,
      extras: "Staffed first-aid point; nearest emergency department mapped in the run of show.",
    };
  }
  if (attendance < 5000) {
    return {
      tier: "First-aid post",
      firstAiders: Math.max(4, perThousand),
      extras: "Dedicated first-aid post plus one ambulance crew on standby.",
    };
  }
  if (attendance < 25000) {
    return {
      tier: "Medical post",
      firstAiders: perThousand,
      extras: "Medical post with a paramedic team and at least one ambulance on site.",
    };
  }
  return {
    tier: "Field medical unit",
    firstAiders: perThousand,
    extras: "Physician-led field medical unit, multiple ambulances, and a medical control plan.",
  };
}

export function CrewSizeCalculator() {
  const fmt = useFormatters();
  const [attendance, setAttendance] = useState(5000);
  const [eventType, setEventType] = useState(EVENT_TYPES[0]!.slug);
  const [doors, setDoors] = useState(4);
  const [bars, setBars] = useState(6);

  const selected = EVENT_TYPES.find((e) => e.slug === eventType) ?? EVENT_TYPES[0]!;

  const results = useMemo(() => {
    const att = Math.max(0, attendance);
    const doorCount = Math.max(0, doors);
    const barCount = Math.max(0, bars);
    const crowdSecurity = Math.ceil(att / selected.securityRatio);
    const doorSecurity = doorCount * 2;
    const barSecurity = Math.ceil(barCount / 3);
    const totalSecurity = Math.max(2, crowdSecurity + doorSecurity + barSecurity);
    const stewards = Math.max(2, Math.ceil(att / selected.stewardRatio));
    const medical = medicalTier(att);
    return { crowdSecurity, doorSecurity, barSecurity, totalSecurity, stewards, medical };
  }, [attendance, doors, bars, selected]);

  return (
    <div className="surface p-6">
      <div className="space-y-4">
        <div>
          <label className="eyebrow" htmlFor="crew-attendance">
            Expected attendance
          </label>
          <input
            id="crew-attendance"
            type="number"
            min={0}
            value={attendance}
            onChange={(e) => setAttendance(Number(e.target.value))}
            className="ps-input mt-1 w-full"
          />
        </div>
        <div>
          <label className="eyebrow" htmlFor="crew-event-type">
            Event type
          </label>
          <select
            id="crew-event-type"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="ps-input mt-1 w-full"
          >
            {EVENT_TYPES.map((e) => (
              <option key={e.slug} value={e.slug}>
                {e.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-[11px] text-[var(--p-text-2)]">{selected.hint}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="eyebrow" htmlFor="crew-doors">
              Door / entry lanes
            </label>
            <input
              id="crew-doors"
              type="number"
              min={0}
              value={doors}
              onChange={(e) => setDoors(Number(e.target.value))}
              className="ps-input mt-1 w-full"
            />
            <p className="mt-2 text-[11px] text-[var(--p-text-2)]">MODELED (rule of thumb): 2 security per lane.</p>
          </div>
          <div>
            <label className="eyebrow" htmlFor="crew-bars">
              Bars / concession points
            </label>
            <input
              id="crew-bars"
              type="number"
              min={0}
              value={bars}
              onChange={(e) => setBars(Number(e.target.value))}
              className="ps-input mt-1 w-full"
            />
            <p className="mt-2 text-[11px] text-[var(--p-text-2)]">
              MODELED (rule of thumb): 1 roamer per 3 points.
            </p>
          </div>
        </div>
      </div>

      <div aria-live="polite" className="mt-6 border-t border-[var(--p-border)] pt-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="eyebrow">Security headcount</div>
              <div className="mt-1 text-[11px] text-[var(--p-text-2)]">
                MODELED (rule of thumb): 1 per {selected.securityRatio} attendees ({fmt.number(results.crowdSecurity)}{" "}
                crowd) + {fmt.number(results.doorSecurity)} on doors + {fmt.number(results.barSecurity)} bar roamers.
              </div>
            </div>
            <div className="font-mono text-2xl font-semibold">{fmt.number(results.totalSecurity)}</div>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="eyebrow">Stewards</div>
              <div className="mt-1 text-[11px] text-[var(--p-text-2)]">
                MODELED (rule of thumb): 1 per {selected.stewardRatio} attendees for wayfinding, queues, and egress
                lanes.
              </div>
            </div>
            <div className="font-mono text-2xl font-semibold">{fmt.number(results.stewards)}</div>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="eyebrow">Medical tier: {results.medical.tier}</div>
              <div className="mt-1 text-[11px] text-[var(--p-text-2)]">
                MODELED (rule of thumb): roughly 2 first aiders per 1,000 attendees. {results.medical.extras}
              </div>
            </div>
            <div className="font-mono text-2xl font-semibold">{fmt.number(results.medical.firstAiders)}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded border border-[var(--p-border)] bg-[var(--p-surface-2)] p-3 text-[11px] leading-relaxed text-[var(--p-text-2)]">
        Every ratio on this page is a MODELED rule of thumb, not a legal minimum. Actual staffing is set by your risk
        assessment, the venue license, local ordinance, and the AHJ. Use this to frame the first budget conversation,
        then verify with your security and medical providers.
      </div>
    </div>
  );
}
