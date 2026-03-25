'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import type { GuideConfig, ContactSection, FAQPair } from '@/data/types';
import {
  EVENT,
  SET_TIMES,
  SCHEDULE,
  DAILY_HOURS,
  CREDENTIAL_MATRIX,
  RESOURCE_LOCATIONS,
  EVACUATION_ROUTES,
  GUEST_FAQ,
  ASSEMBLY_POINT,
  EMS_STAGING,
} from '@/data/shared';

const PAGE_TITLES = [
  'Event & Venue',
  'Before You Arrive',
  'Show Day',
  'The Experience',
  'Safety & Security',
  'Communications',
  'Resources',
  'Guest FAQ',
  'Role Guide',
];

/* ─── Helpers ─── */

function PinkCallout({ children }: { children: React.ReactNode }) {
  return (
    <div className="callout-pink border-l-4 border-pink bg-warm rounded-r-lg p-4 my-4">
      {children}
    </div>
  );
}

function GoldCallout({ children }: { children: React.ReactNode }) {
  return (
    <div className="callout-gold border-l-4 border-gold bg-gold-light rounded-r-lg p-4 my-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-gold mb-1">Good to Know</p>
      {children}
    </div>
  );
}

function RedBadge({ text }: { text: string }) {
  return (
    <span className="inline-block text-[11px] font-mono font-semibold tracking-wider text-red uppercase">
      {text}
    </span>
  );
}

function SectionWrapper({
  num,
  title,
  id,
  children,
}: {
  num: number;
  title: string;
  id: string;
  children: React.ReactNode;
}) {
  const padded = String(num).padStart(2, '0');
  return (
    <section id={id} className="page-section scroll-mt-28 py-12 md:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-end gap-4 mb-2">
          <span className="font-display text-5xl md:text-6xl font-extrabold text-pink/20 leading-none select-none">
            {padded}
          </span>
          <h2 className="font-display text-xl md:text-2xl font-bold uppercase tracking-wide text-black pb-1">
            {title}
          </h2>
        </div>
        <div className="w-full h-px bg-pink/30 mb-8" />
        {children}
      </div>
    </section>
  );
}

function Accordion({ question, answer, defaultOpen = false }: { question: string; answer: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border">
      <button
        className="w-full flex items-center justify-between py-4 text-left gap-4"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="font-semibold text-dark text-sm md:text-base">{question}</span>
        <span
          className={`text-pink text-xl shrink-0 transition-transform duration-200 ${open ? 'rotate-45' : ''}`}
        >
          +
        </span>
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
          <p className="text-medium text-sm leading-relaxed pb-4">{answer}</p>
        </div>
      </div>
    </div>
  );
}

function SOPCard({ sop }: { sop: NonNullable<GuideConfig['emergencySOPs']>[number] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-lg mb-3 overflow-hidden">
      <button
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted transition-colors"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="inline-block w-28 text-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-pink text-white shrink-0">
          {sop.code}
        </span>
        <span className="font-semibold text-dark flex-1">{sop.title}</span>
        <span className={`text-pink transition-transform duration-200 ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      <div className={`grid transition-all duration-300 ease-in-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="px-4 pb-4">
            <ol className="list-decimal list-inside space-y-2 text-sm text-dark mb-4">
              {sop.steps.map((step, i) => (
                <li key={i} className="leading-relaxed">{step}</li>
              ))}
            </ol>
            {sop.note && (
              <GoldCallout>
                <p className="text-sm text-dark">{sop.note}</p>
              </GoldCallout>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DataTable({
  headers,
  rows,
  dark = false,
  highlightRow,
}: {
  headers: (string | React.ReactNode)[];
  rows: (string | React.ReactNode)[][];
  dark?: boolean;
  highlightRow?: number;
}) {
  return (
    <div className="table-scroll overflow-x-auto rounded-lg border border-border my-4">
      <table className="w-full text-sm">
        <thead>
          <tr className={dark ? 'bg-gray-900 text-gray-100' : 'bg-black text-white'}>
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              className={`border-t border-border ${
                highlightRow === ri
                  ? 'bg-warm font-semibold'
                  : ri % 2 === 0
                  ? 'bg-white'
                  : 'bg-muted'
              }`}
            >
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2.5 whitespace-nowrap">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ContactTable({ contacts }: { contacts: ContactSection[] }) {
  const rows: (string | React.ReactNode)[][] = [];
  for (const c of contacts) {
    if (c.type === 'header') {
      rows.push([
        <span key={c.label} className="font-bold uppercase tracking-wider text-xs text-dark">{c.label}</span>,
        '',
        '',
      ]);
    } else {
      rows.push([
        <span key={c.label} className="font-medium">{c.label}</span>,
        c.phone ? <span key={`${c.label}-p`} className="font-mono text-xs text-pink">{c.phone}</span> : '',
        c.notes || '',
      ]);
    }
  }
  return <DataTable headers={['Contact', 'Phone / Email', 'Notes']} rows={rows} />;
}

function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print-hide inline-flex items-center gap-1.5 text-xs text-light hover:text-pink transition-colors mt-4"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      Print This Section
    </button>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <h3 className="font-display text-base font-bold uppercase tracking-wide text-dark mb-3">{title}</h3>
      {children}
    </div>
  );
}

function AccessBadge({ access }: { access: boolean }) {
  return access ? (
    <span className="text-emerald-600 font-bold">&#10003;</span>
  ) : (
    <span className="text-gray-300">&mdash;</span>
  );
}

/* ─── Credential filtering ─── */
const GUEST_FACING_CREDENTIALS = ['Backstage', 'Stage Table North', 'Stage Table South', 'Grandstand Table', 'VIP'];

function getCredentialHighlightIndex(tier: number, filtered: boolean): number {
  if (filtered) {
    // Guest filtered matrix: Backstage(0), STN(1), STS(2), GT(3), VIP(4)
    return tier === 5 ? 4 : -1;
  }
  // Full matrix: Core+Escort(0), Production(1), Crew(2), Artist(3), Backstage(4), STN(5), STS(6), GT(7), VIP(8)
  const map: Record<number, number> = { 1: 1, 2: 2, 3: 2, 4: 3, 5: 8, 6: -1 };
  return map[tier] ?? -1;
}

/* ─── Main Component ─── */

export default function GuideView({ guide }: { guide: GuideConfig }) {
  const [activeSection, setActiveSection] = useState(1);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  const observerCallback = useCallback((entries: IntersectionObserverEntry[]) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        const num = parseInt(id.replace('section-', ''), 10);
        if (!isNaN(num)) setActiveSection(num);
      }
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(observerCallback, {
      rootMargin: '-100px 0px -60% 0px',
      threshold: 0,
    });
    for (let i = 1; i <= 9; i++) {
      const el = document.getElementById(`section-${i}`);
      if (el) {
        sectionRefs.current[i] = el;
        observer.observe(el);
      }
    }
    return () => observer.disconnect();
  }, [observerCallback]);

  const scrollTo = (num: number) => {
    const el = document.getElementById(`section-${num}`);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const isGuestOrTemp = guide.tier >= 5;
  const showFilteredMatrix = guide.tier === 5;
  const hideMatrix = guide.tier === 6;
  const credHighlight = getCredentialHighlightIndex(guide.tier, showFilteredMatrix);
  const filteredMatrix = showFilteredMatrix
    ? CREDENTIAL_MATRIX.filter((r) => GUEST_FACING_CREDENTIALS.includes(r.credential))
    : CREDENTIAL_MATRIX;

  return (
    <div className="min-h-screen bg-white">
      {/* ─── Sticky Navigation ─── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border print-hide">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-12">
            <Link href="/" className="text-pink hover:text-pink/80 transition-colors text-sm font-medium flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
            <h1 className="font-display text-sm font-bold uppercase tracking-wider text-black">
              {guide.title}
            </h1>
            {guide.classification ? (
              <RedBadge text={guide.classification.split('—')[0].trim()} />
            ) : (
              <span />
            )}
          </div>
        </div>
        {/* Page pills */}
        <div className="overflow-x-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 flex gap-1.5 pb-2.5">
            {PAGE_TITLES.map((title, i) => {
              const num = i + 1;
              const isActive = activeSection === num;
              return (
                <button
                  key={num}
                  onClick={() => scrollTo(num)}
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-pink text-white shadow-sm'
                      : 'bg-muted text-medium hover:bg-border hover:text-dark'
                  }`}
                  title={title}
                >
                  {String(num).padStart(2, '0')}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ─── Content ─── */}
      <main id="main-content">
        {/* ═══ Page 1: Event & Venue ═══ */}
        <SectionWrapper num={1} title="Event & Venue Information" id="section-1">
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-2xl font-bold text-black">{EVENT.title}</h3>
              <p className="text-medium italic">{SET_TIMES.length > 0 && 'Open Air at the Racetrack'}</p>
              <p className="text-sm text-light mt-1">{EVENT.series} &middot; Presented by {EVENT.presenter}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-light mb-1">Venue</p>
                <p className="font-medium text-dark">{EVENT.venue}</p>
                <p className="text-sm text-medium">{EVENT.address}</p>
                <p className="text-sm text-medium font-mono">{EVENT.phone}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-light mb-1">Date</p>
                <p className="font-medium text-dark">{EVENT.date}</p>
              </div>
            </div>

            {guide.tier <= 3 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-light mb-1">Capacity</p>
                  <p className="text-sm font-mono text-dark">{EVENT.capacity}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-light mb-1">Project Code</p>
                  <p className="text-sm font-mono text-dark">{EVENT.projectCode}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-light mb-1">Site Plan</p>
                  <a href={EVENT.sitePlan} target="_blank" rel="noopener noreferrer" className="text-sm text-pink hover:underline">
                    Open in Carta Maps
                  </a>
                </div>
              </div>
            )}

            {guide.tier === 6 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-light mb-1">Project Code</p>
                <p className="text-sm font-mono text-dark">{EVENT.projectCode}</p>
              </div>
            )}

            <PinkCallout>
              <p className="font-semibold text-dark text-sm">
                {guide.tier <= 4 ? 'Call Time' : 'Doors'}
              </p>
              <p className="text-dark text-sm mt-1">{guide.callTime}</p>
            </PinkCallout>

            <SubSection title="Set Times">
              <div className="space-y-2">
                {SET_TIMES.map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="font-mono text-xs text-pink w-36 shrink-0">{s.time}</span>
                    <span className="text-sm text-dark font-medium">
                      {s.artist} {s.note && <span className="text-light">({s.note})</span>}
                    </span>
                  </div>
                ))}
              </div>
            </SubSection>

            {guide.tier <= 4 && (
              <SubSection title="Schedule">
                <div className="space-y-1.5">
                  {SCHEDULE.map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-sm text-dark w-36 shrink-0">{s.label}</span>
                      <span className="font-mono text-xs text-pink">{s.datetime}</span>
                    </div>
                  ))}
                </div>
              </SubSection>
            )}

            {guide.tier <= 4 && (
              <SubSection title="Daily Hours of Operation">
                <p className="font-mono text-sm text-dark">{DAILY_HOURS}</p>
              </SubSection>
            )}
          </div>
          <PrintButton />
        </SectionWrapper>

        {/* ═══ Page 2: Before You Arrive ═══ */}
        <SectionWrapper num={2} title="Before You Arrive" id="section-2">
          <SubSection title="Pre-Arrival Checklist">
            <ul className="space-y-2">
              {guide.preArrival.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-dark">
                  <span className="text-pink mt-0.5 shrink-0">&#10003;</span>
                  {item}
                </li>
              ))}
            </ul>
          </SubSection>

          <SubSection title="Your Route In">
            <p className="text-sm text-dark leading-relaxed">{guide.vehicleRoute}</p>
          </SubSection>

          <SubSection title="Where to Park">
            <p className="text-sm text-dark leading-relaxed">{guide.parking}</p>
          </SubSection>

          <SubSection title="Arriving by Rideshare">
            <p className="text-sm text-dark leading-relaxed">{guide.rideshare}</p>
          </SubSection>

          <SubSection title="Arriving by Public Transit">
            <p className="text-sm text-dark leading-relaxed">{guide.transit}</p>
          </SubSection>

          <SubSection title="Check-In & Wayfinding">
            <p className="text-sm text-dark leading-relaxed">{guide.wayfinding}</p>
            <p className="text-sm text-dark leading-relaxed mt-3">{guide.credentials}</p>
            <PinkCallout>
              {guide.entrance.includes('\n') ? (
                <div className="text-sm text-dark font-medium">
                  {guide.entrance.split('\n').map((line, i) => (
                    <span key={i} className={i === 0 ? 'block font-bold' : 'block'}>{line}</span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-dark font-medium">{guide.entrance}</p>
              )}
            </PinkCallout>
          </SubSection>

          {guide.additionalNotes.length > 0 && (
            <SubSection title="A Few More Things">
              <ul className="space-y-2">
                {guide.additionalNotes.map((note, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-dark">
                    <span className="text-pink mt-0.5 shrink-0">&bull;</span>
                    {note}
                  </li>
                ))}
              </ul>
            </SubSection>
          )}
          <PrintButton />
        </SectionWrapper>

        {/* ═══ Page 3: Show Day (consolidated schedule + timeline) ═══ */}
        <SectionWrapper
          num={3}
          title={guide.tier <= 3 ? 'Build & Show Day' : guide.tier === 5 ? 'The Night' : guide.tier === 4 ? 'The Program' : 'Schedule'}
          id="section-3"
        >
          {guide.scheduleAltContent && (
            <p className="text-sm text-dark leading-relaxed mb-6">{guide.scheduleAltContent}</p>
          )}

          {guide.buildSchedule && guide.buildSchedule.length > 0 && (
            <SubSection title="Build Schedule">
              <DataTable
                headers={['Date', 'Time', 'Activity']}
                rows={guide.buildSchedule.map((s) => [s.date, s.time, s.activity])}
              />
            </SubSection>
          )}

          {guide.strikeSchedule && guide.strikeSchedule.length > 0 && (
            <SubSection title="Strike Schedule">
              <DataTable
                headers={['Date', 'Time', 'Activity']}
                rows={guide.strikeSchedule.map((s) => [s.date, s.time, s.activity])}
              />
            </SubSection>
          )}

          {guide.showTimeline && guide.showTimeline.length > 0 && (
            <SubSection title={guide.tier <= 3 ? 'Show Day Milestones' : guide.tier === 5 ? 'Your Evening' : 'Timeline'}>
              <DataTable
                headers={['Time', 'Activity']}
                rows={guide.showTimeline.map((t) => [
                  <span key={t.time} className="font-mono text-xs text-pink whitespace-nowrap">{t.time}</span>,
                  t.activity,
                ])}
              />
            </SubSection>
          )}

          {guide.showAltContent && (
            <p className="text-sm text-dark leading-relaxed mt-4">{guide.showAltContent}</p>
          )}
          <PrintButton />
        </SectionWrapper>

        {/* ═══ Page 4: The Experience ═══ */}
        <SectionWrapper num={4} title="The Experience" id="section-4">
          {guide.venueAmenities && guide.venueAmenities.length > 0 && (
            <SubSection title="Amenities">
              <p className="text-sm text-dark leading-relaxed mb-4">
                {guide.tier <= 3
                  ? 'These resources are available to all crew throughout the build, show, and strike.'
                  : guide.tier === 4
                  ? 'Your Liaison can help you access any of the following.'
                  : guide.tier === 6
                  ? 'Your escort can direct you to these resources while on site.'
                  : 'Here\u2019s what\u2019s available on site to make your night easier.'}
              </p>
              <div className="space-y-3">
                {guide.venueAmenities.map((a, i) => {
                  const dashIndex = a.indexOf(' — ');
                  const feature = dashIndex >= 0 ? a.slice(0, dashIndex) : a;
                  const detail = dashIndex >= 0 ? a.slice(dashIndex + 3) : '';
                  return (
                    <div key={i}>
                      <p className="font-medium text-sm text-dark">{feature}</p>
                      {detail && <p className="text-sm text-medium">{detail}</p>}
                    </div>
                  );
                })}
              </div>
            </SubSection>
          )}

          {guide.accessibilityItems && guide.accessibilityItems.length > 0 && (
            <SubSection title="Accessibility">
              <div className="space-y-3">
                {guide.accessibilityItems.map((a, i) => (
                  <div key={i}>
                    <p className="font-medium text-sm text-dark">{a.feature}</p>
                    <p className="text-sm text-medium">{a.detail}</p>
                  </div>
                ))}
              </div>
            </SubSection>
          )}

          {guide.sustainabilityItems && guide.sustainabilityItems.length > 0 && (
            <SubSection title="Sustainability">
              <div className="space-y-3">
                {guide.sustainabilityItems.map((s, i) => (
                  <div key={i}>
                    <p className="font-medium text-sm text-dark">{s.initiative}</p>
                    <p className="text-sm text-medium">{s.detail}</p>
                  </div>
                ))}
              </div>
            </SubSection>
          )}

          {!hideMatrix && (
            <SubSection title="Credential Access Matrix">
              {showFilteredMatrix ? (
                <DataTable
                  headers={[
                    'Credential',
                    <span key="ga">{'GA'}<br />{'Grandstands + Dance Floor'}</span>,
                    'VIP Dance Floor',
                    'VIP Clubhouse',
                    <span key="vt-gd">VIP Tables<br />Grandstand</span>,
                    <span key="vt-ss">VIP Tables<br />Stage South</span>,
                    <span key="vt-sn">VIP Tables<br />Stage North</span>,
                    'Backstage',
                  ]}
                  rows={filteredMatrix.map((r) => [
                    <span key={r.credential} className="font-medium">{r.credential}</span>,
                    <AccessBadge key={`${r.credential}-ga`} access={r.grandstandsGA} />,
                    <AccessBadge key={`${r.credential}-vdf`} access={r.vipDanceFloor} />,
                    <AccessBadge key={`${r.credential}-vc`} access={r.vipClubhouse} />,
                    <AccessBadge key={`${r.credential}-vb`} access={r.vipBackstage} />,
                    <AccessBadge key={`${r.credential}-vsts`} access={r.vipStageTableSouth} />,
                    <AccessBadge key={`${r.credential}-vstn`} access={r.vipStageTableNorth} />,
                    <AccessBadge key={`${r.credential}-bs`} access={r.backstage} />,
                  ])}
                  highlightRow={credHighlight}
                />
              ) : (
                <DataTable
                  headers={[
                    'Credential',
                    <span key="ga">{'GA'}<br />{'Grandstands + Dance Floor'}</span>,
                    'VIP Dance Floor',
                    'VIP Clubhouse',
                    <span key="vt-gd">VIP Tables<br />Grandstand</span>,
                    <span key="vt-ss">VIP Tables<br />Stage South</span>,
                    <span key="vt-sn">VIP Tables<br />Stage North</span>,
                    'Backstage',
                    'Stage',
                    'Back of House',
                    'Command Center',
                  ]}
                  rows={CREDENTIAL_MATRIX.map((r) => [
                    <span key={r.credential} className="font-medium">{r.credential}</span>,
                    <AccessBadge key={`${r.credential}-ga`} access={r.grandstandsGA} />,
                    <AccessBadge key={`${r.credential}-vdf`} access={r.vipDanceFloor} />,
                    <AccessBadge key={`${r.credential}-vc`} access={r.vipClubhouse} />,
                    <AccessBadge key={`${r.credential}-vb`} access={r.vipBackstage} />,
                    <AccessBadge key={`${r.credential}-vsts`} access={r.vipStageTableSouth} />,
                    <AccessBadge key={`${r.credential}-vstn`} access={r.vipStageTableNorth} />,
                    <AccessBadge key={`${r.credential}-bs`} access={r.backstage} />,
                    <AccessBadge key={`${r.credential}-st`} access={r.stage} />,
                    <AccessBadge key={`${r.credential}-boh`} access={r.backOfHouse} />,
                    <AccessBadge key={`${r.credential}-cc`} access={r.commandCenter} />,
                  ])}
                  highlightRow={credHighlight}
                />
              )}
            </SubSection>
          )}

          {hideMatrix && (
            <GoldCallout>
              <p className="text-sm text-dark">Temporary credentials do not grant access to any guest, VIP, crew, or backstage areas. Your escort will guide you to your authorized work zone.</p>
            </GoldCallout>
          )}
          <PrintButton />
        </SectionWrapper>

        {/* ═══ Page 5: Communications / Who to Contact ═══ */}
        <SectionWrapper num={5} title={guide.tier <= 3 ? 'Communications' : 'Who to Contact'} id="section-5">
          {guide.radioChannels && guide.radioChannels.length > 0 && (
            <>
              <SubSection title="Radio Channel Matrix">
                <DataTable
                  headers={['Channel', 'Assignment', 'Notes']}
                  rows={guide.radioChannels.map((ch) => [
                    <span key={ch.channel} className="font-mono text-pink font-bold">{ch.channel}</span>,
                    <span key={`${ch.channel}-a`} className="font-medium">{ch.assignment}</span>,
                    ch.notes,
                  ])}
                />
              </SubSection>

              {guide.codeWords && guide.codeWords.length > 0 && (
                <SubSection title="Code Words">
                  <DataTable
                    headers={['Code', 'Meaning']}
                    rows={guide.codeWords.map((cw) => [
                      <span key={cw.code} className="font-mono font-bold text-pink">{cw.code}</span>,
                      cw.meaning,
                    ])}
                  />
                </SubSection>
              )}

              {guide.radioProtocol && (
                <SubSection title="Radio Protocol">
                  <p className="text-sm text-dark leading-relaxed bg-muted p-4 rounded-lg">{guide.radioProtocol}</p>
                </SubSection>
              )}

              {guide.chainOfCommand && guide.chainOfCommand.length > 0 && (
                <SubSection title="Chain of Command">
                  <DataTable
                    headers={['Role', 'Responsibility', 'Radio']}
                    rows={guide.chainOfCommand.map((c) => [
                      <span key={c.role} className="font-medium">{c.role}</span>,
                      c.responsibility,
                      <span key={`${c.role}-r`} className="font-mono text-xs text-pink">{c.radio}</span>,
                    ])}
                  />
                </SubSection>
              )}
            </>
          )}

          {guide.commsAltContent && guide.commsAltContent.length > 0 && (
            <>
              <p className="text-sm text-dark leading-relaxed mb-4">{guide.commsAltContent[0]}</p>
              {guide.commsAltContent.length > 1 && (
                <ul className="space-y-2">
                  {guide.commsAltContent.slice(1).map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-dark">
                      <span className="text-pink mt-0.5 shrink-0">&bull;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {guide.contactsIntro && (
            <div className="mt-6">
              <p className="text-sm text-dark mb-4">{guide.contactsIntro}</p>
            </div>
          )}

          <SubSection title="Contact Directory">
            <ContactTable contacts={guide.contactDirectory} />
          </SubSection>
          <PrintButton />
        </SectionWrapper>

        {/* ═══ Page 6: Safety & Security ═══ */}
        <SectionWrapper num={6} title={guide.tier <= 3 ? 'Safety & Security' : 'Your Safety'} id="section-6">
          {!guide.ppeTable && guide.safetyAltContent && guide.safetyAltContent.length > 0 && (
            <p className="text-sm text-dark leading-relaxed mb-4">{guide.safetyAltContent[0]}</p>
          )}
          {guide.ppeTable && guide.ppeTable.length > 0 && (
            <SubSection title="Required Personal Protective Equipment">
              <DataTable
                headers={['Gear', 'Spec', 'Who']}
                rows={guide.ppeTable.map((p) => [p.gear, p.spec, p.who])}
              />
            </SubSection>
          )}

          {guide.safetyRules && guide.safetyRules.length > 0 && (
            <SubSection title={guide.tier === 3 ? 'F&B Service Standards' : 'Workplace Safety Rules'}>
              <ol className="space-y-2 list-decimal list-inside">
                {guide.safetyRules.map((rule, i) => (
                  <li key={i} className="text-sm text-dark leading-relaxed">{rule}</li>
                ))}
              </ol>
            </SubSection>
          )}

          {guide.safetyAltContent && guide.safetyAltContent.length > 1 && (
            <ul className="space-y-2 mt-4">
              {guide.safetyAltContent.slice(1).map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-dark">
                  <span className="text-pink mt-0.5 shrink-0">&bull;</span>
                  {item}
                </li>
              ))}
            </ul>
          )}

          {guide.securityPolicies && guide.securityPolicies.length > 0 && (
            <SubSection title="Security & Policies">
              <ul className="space-y-2">
                {guide.securityPolicies.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-dark">
                    <span className="text-pink mt-0.5 shrink-0">&bull;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </SubSection>
          )}

          {guide.emergencySOPs && guide.emergencySOPs.length > 0 && (
            <SubSection title="Emergency Procedures">
              <div className="space-y-0">
                {guide.emergencySOPs.map((sop, i) => (
                  <SOPCard key={i} sop={sop} />
                ))}
              </div>
            </SubSection>
          )}

          {guide.emergencyAltContent && guide.emergencyAltContent.length > 0 && (
            <SubSection title="In an Emergency">
              <p className="text-sm text-dark leading-relaxed mb-4">{guide.emergencyAltContent[0]}</p>
              {guide.emergencyAltContent.length > 1 && (
                <ul className="space-y-2">
                  {guide.emergencyAltContent.slice(1).map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-dark">
                      <span className="text-pink mt-0.5 shrink-0">&bull;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </SubSection>
          )}
          <PrintButton />
        </SectionWrapper>

        {/* ═══ Page 7: Resources & Evacuation ═══ */}
        <SectionWrapper num={7} title={guide.tier <= 3 ? 'Resources & Evacuation' : 'In Case of Emergency'} id="section-7">
          <SubSection title="Emergency Resource Locations">
            <DataTable
              headers={['Resource', 'Location', 'Zone']}
              rows={RESOURCE_LOCATIONS.map((r) => [r.resource, r.location, r.zone])}
            />
          </SubSection>

          <SubSection title="Evacuation Routes">
            <DataTable
              headers={['From', 'Route', 'Destination']}
              rows={EVACUATION_ROUTES.map((r) => [r.from, r.route, r.destination])}
            />
          </SubSection>

          <PinkCallout>
            <p className="text-sm text-dark">
              <strong>Assembly Point:</strong> {ASSEMBLY_POINT} &middot;{' '}
              <strong>EMS Staging:</strong> {EMS_STAGING} &middot;{' '}
              <strong>Nobody re-enters until All Clear.</strong>
            </p>
          </PinkCallout>

          {guide.fireSafety && guide.fireSafety.length > 0 && (
            <SubSection title="Fire Safety">
              <DataTable
                headers={['Item', 'Specification']}
                rows={guide.fireSafety.map((f) => [f.item, f.spec])}
              />
            </SubSection>
          )}

          {guide.lifeSafety && guide.lifeSafety.length > 0 && (
            <SubSection title="Life Safety">
              <DataTable
                headers={['Item', 'Specification']}
                rows={guide.lifeSafety.map((l) => [l.item, l.spec])}
              />
            </SubSection>
          )}
          <PrintButton />
        </SectionWrapper>

        {/* ═══ Page 8: Guest FAQ ═══ */}
        <SectionWrapper num={8} title="The Answers You Need — Guest FAQ" id="section-8">
          {guide.guestFAQIntro && (
            <p className="text-sm text-dark leading-relaxed mb-6 italic">{guide.guestFAQIntro}</p>
          )}
          <div>
            {GUEST_FAQ.map((faq, i) => (
              <Accordion key={i} question={faq.question} answer={faq.answer} />
            ))}
          </div>
          <PrintButton />
        </SectionWrapper>

        {/* ═══ Page 9: Role Guide + Contacts ═══ */}
        <SectionWrapper
          num={9}
          title={guide.roleFAQTitle || (guide.tier === 5 ? 'More Info' : 'Contacts')}
          id="section-9"
        >
          {guide.tier === 5 && EVENT.eventLinks && (
            <SubSection title="Links">
              <div className="flex flex-wrap gap-3">
                {EVENT.eventLinks.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-full bg-pink px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-white hover:bg-pink/80 transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </SubSection>
          )}
          {guide.tier === 5 && (
            <SubSection title="Connect">
              <p className="text-sm text-medium mb-4">Follow the artists and stay in the loop for future events.</p>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold w-28">Black Coffee</span>
                  <a href="https://www.instagram.com/realblackcoffee" target="_blank" rel="noopener noreferrer" className="text-pink hover:underline">@realblackcoffee</a>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold w-28">Carlita</span>
                  <a href="https://www.instagram.com/carlitamusic" target="_blank" rel="noopener noreferrer" className="text-pink hover:underline">@carlitamusic</a>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold w-28">Kaz James</span>
                  <a href="https://www.instagram.com/kazjames" target="_blank" rel="noopener noreferrer" className="text-pink hover:underline">@kazjames</a>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold w-28">Club Space</span>
                  <a href="https://www.instagram.com/clubspace" target="_blank" rel="noopener noreferrer" className="text-pink hover:underline">@clubspace</a>
                </div>
              </div>
            </SubSection>
          )}
          {guide.tier === 5 && (
            <SubSection title="Contact">
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-semibold">General inquiries:</span>{' '}
                  <a href="mailto:info@clubspace.com" className="text-pink hover:underline">info@clubspace.com</a>
                </p>
                <p>
                  <span className="font-semibold">Venue:</span>{' '}
                  {EVENT.venue} &middot; {EVENT.address}
                </p>
                <p>
                  <span className="font-semibold">Venue phone:</span>{' '}
                  <a href={`tel:${EVENT.phone}`} className="text-pink hover:underline">{EVENT.phone}</a>
                </p>
              </div>
            </SubSection>
          )}
          {guide.roleFAQ && guide.roleFAQ.length > 0 && (
            <SubSection title={guide.roleFAQTitle || 'FAQ'}>
              <div>
                {guide.roleFAQ.map((faq, i) => (
                  <Accordion key={i} question={faq.question} answer={faq.answer} />
                ))}
              </div>
            </SubSection>
          )}
          <PrintButton />
        </SectionWrapper>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border py-8 text-center print-hide">
        <p className="text-xs text-light/50 tracking-[0.2em] font-semibold">{EVENT.producer}</p>
        <div className="flex justify-center items-center gap-5 mt-3">
          <a href={`mailto:${EVENT.contact}`} title="Email us" className="text-light/40 hover:text-pink transition-colors" aria-label="Email">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 4L12 13 2 4"/></svg>
          </a>
          <a href="https://calendly.com/ghxstship/sync" target="_blank" rel="noopener noreferrer" title="Book a meeting" className="text-light/40 hover:text-pink transition-colors" aria-label="Schedule">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          </a>
          <span className="w-px h-3 bg-light/20" />
          <a href={EVENT.socials.instagram} target="_blank" rel="noopener noreferrer" title="Instagram" className="text-light/40 hover:text-pink transition-colors" aria-label="Instagram">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </a>
          <a href={EVENT.socials.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn" className="text-light/40 hover:text-pink transition-colors" aria-label="LinkedIn">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          </a>
          <a href={EVENT.socials.youtube} target="_blank" rel="noopener noreferrer" title="YouTube" className="text-light/40 hover:text-pink transition-colors" aria-label="YouTube">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          </a>
          <a href={EVENT.socials.website} target="_blank" rel="noopener noreferrer" title="Website" className="text-light/40 hover:text-pink transition-colors" aria-label="Website">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
          </a>
        </div>
        <p className="text-[10px] text-light/25 mt-4">&copy; 2026 {EVENT.producer}</p>
      </footer>
    </div>
  );
}
