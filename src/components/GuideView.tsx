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
  'Build & Credentials',
  'Show Day',
  'Safety',
  'Communications',
  'Emergency',
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
        <span className="inline-block px-2 py-0.5 rounded text-xs font-mono font-bold bg-pink text-white shrink-0">
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

function ContactList({ contacts }: { contacts: ContactSection[] }) {
  return (
    <div className="space-y-1">
      {contacts.map((c, i) =>
        c.type === 'header' ? (
          <h4
            key={i}
            className="font-display font-bold text-sm uppercase tracking-wider text-dark pt-4 pb-1 first:pt-0"
          >
            {c.label}
          </h4>
        ) : (
          <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-2 border-b border-border/50 text-sm">
            <span className="font-medium text-dark min-w-[160px]">{c.label}</span>
            {c.phone && <span className="font-mono text-xs text-pink">{c.phone}</span>}
            {c.notes && <span className="text-light text-xs">{c.notes}</span>}
          </div>
        )
      )}
    </div>
  );
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

/* ─── Credential row highlight ─── */
function getCredentialHighlightIndex(tier: number): number {
  // Matrix rows: Core+Escort(0), Production(1), Crew(2), Artist(3), Backstage(4), Stage Table North(5), Stage Table South(6), Grandstand Table(7), VIP(8)
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
    for (let i = 1; i <= 10; i++) {
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

  const credHighlight = getCredentialHighlightIndex(guide.tier);

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

            <SubSection title="Daily Hours of Operation">
              <p className="font-mono text-sm text-dark">{DAILY_HOURS}</p>
            </SubSection>
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
              <p className="text-sm text-dark font-medium">{guide.entrance}</p>
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

        {/* ═══ Page 3: Build & Credentials ═══ */}
        <SectionWrapper num={3} title={guide.tier <= 3 ? 'The Build & The Strike' : guide.tier === 5 ? 'Your Schedule' : 'Schedule & Credentials'} id="section-3">
          {guide.buildSchedule && guide.buildSchedule.length > 0 && (
            <>
              <SubSection title="Build Schedule">
                <DataTable
                  headers={['Date', 'Time', 'Activity']}
                  rows={guide.buildSchedule.map((s) => [s.date, s.time, s.activity])}
                />
              </SubSection>
              {guide.strikeSchedule && guide.strikeSchedule.length > 0 && (
                <SubSection title="Strike Schedule">
                  <DataTable
                    headers={['Date', 'Time', 'Activity']}
                    rows={guide.strikeSchedule.map((s) => [s.date, s.time, s.activity])}
                  />
                </SubSection>
              )}
            </>
          )}

          {guide.scheduleAltContent && (
            <p className="text-sm text-dark leading-relaxed mb-6">{guide.scheduleAltContent}</p>
          )}

          <SubSection title="Credential Access Matrix">
            <DataTable
              headers={[
                'Credential',
                'Grandstands (GA)',
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
          </SubSection>
          <PrintButton />
        </SectionWrapper>

        {/* ═══ Page 4: Show Day ═══ */}
        <SectionWrapper num={4} title={guide.tier <= 3 ? 'Show Day Timeline' : guide.tier === 5 ? 'The Night' : 'The Program'} id="section-4">
          {guide.showAltContent && (
            <p className="text-sm text-dark leading-relaxed mb-6">{guide.showAltContent}</p>
          )}

          {guide.showTimeline && guide.showTimeline.length > 0 && (
            <DataTable
              headers={['Time', 'Activity']}
              rows={guide.showTimeline.map((t) => [
                <span key={t.time} className="font-mono text-xs text-pink whitespace-nowrap">{t.time}</span>,
                t.activity,
              ])}
            />
          )}

          {guide.venueAmenities && guide.venueAmenities.length > 0 && (
            <SubSection title="On Site">
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {guide.venueAmenities.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-dark">
                    <span className="text-pink shrink-0">&bull;</span>
                    {a}
                  </li>
                ))}
              </ul>
            </SubSection>
          )}
          <PrintButton />
        </SectionWrapper>

        {/* ═══ Page 5: Safety ═══ */}
        <SectionWrapper num={5} title={guide.tier <= 3 ? 'Gear Up' : 'Your Safety'} id="section-5">
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

          {guide.safetyAltContent && guide.safetyAltContent.length > 0 && (
            <ul className="space-y-2 mt-4">
              {guide.safetyAltContent.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-dark">
                  <span className="text-pink mt-0.5 shrink-0">&bull;</span>
                  {item}
                </li>
              ))}
            </ul>
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
          <PrintButton />
        </SectionWrapper>

        {/* ═══ Page 6: Communications ═══ */}
        <SectionWrapper num={6} title={guide.tier <= 3 ? 'Stay Connected' : 'Who to Contact'} id="section-6">
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
            <ul className="space-y-2">
              {guide.commsAltContent.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-dark">
                  <span className="text-pink mt-0.5 shrink-0">&bull;</span>
                  {item}
                </li>
              ))}
            </ul>
          )}

          {guide.contactsIntro && (
            <div className="mt-6">
              <p className="text-sm text-dark mb-4">{guide.contactsIntro}</p>
            </div>
          )}
          <PrintButton />
        </SectionWrapper>

        {/* ═══ Page 7: Emergency ═══ */}
        <SectionWrapper num={7} title="If Something Goes Wrong" id="section-7">
          {guide.emergencySOPs && guide.emergencySOPs.length > 0 && (
            <div className="space-y-0">
              {guide.emergencySOPs.map((sop, i) => (
                <SOPCard key={i} sop={sop} />
              ))}
            </div>
          )}

          {guide.emergencyAltContent && guide.emergencyAltContent.length > 0 && (
            <ul className="space-y-2">
              {guide.emergencyAltContent.map((item, i) => (
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
          <PrintButton />
        </SectionWrapper>

        {/* ═══ Page 8: Resources & Evacuation ═══ */}
        <SectionWrapper num={8} title="Help Is Here — Resources & Evacuation" id="section-8">
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

          {guide.accessibilityItems && guide.tier !== 6 && (
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
          <PrintButton />
        </SectionWrapper>

        {/* ═══ Page 9: Guest FAQ ═══ */}
        <SectionWrapper num={9} title="The Answers You Need — Guest FAQ" id="section-9">
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

        {/* ═══ Page 10: Role Guide + Contacts ═══ */}
        <SectionWrapper
          num={10}
          title={guide.roleFAQTitle || (guide.tier === 5 ? 'More Info' : 'Contacts')}
          id="section-10"
        >
          {guide.roleFAQ && guide.roleFAQ.length > 0 && (
            <SubSection title={guide.roleFAQTitle || 'FAQ'}>
              <div>
                {guide.roleFAQ.map((faq, i) => (
                  <Accordion key={i} question={faq.question} answer={faq.answer} />
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

          <SubSection title="Contact Directory">
            <ContactList contacts={guide.contactDirectory} />
          </SubSection>
          <PrintButton />
        </SectionWrapper>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border py-8 text-center print-hide">
        <p className="text-xs text-light">
          <a href="mailto:sos@ghxstship.pro" className="text-pink hover:underline">
            sos@ghxstship.pro
          </a>
        </p>
        <p className="text-xs text-light mt-1">
          {EVENT.venue} &middot; {EVENT.address}
        </p>
        <p className="text-xs text-light/50 mt-2">GHXSTSHIP Industries</p>
      </footer>
    </div>
  );
}
