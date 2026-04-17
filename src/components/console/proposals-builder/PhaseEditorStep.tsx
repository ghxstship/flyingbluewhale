'use client';

import { useState } from 'react';
import {
  type PhaseData,
  type DeliverableData,
  type AddonData,
  type MilestoneRequirementData,
  type CreativeReferenceData,
  type PortfolioLinkData,
  type CreativeRefType,
  CATEGORY_SUGGESTIONS,
  UNIT_OPTIONS,
  ASSIGNEE_OPTIONS,
  CREATIVE_REF_TYPES,
  createEmptyDeliverable,
  createEmptyAddon,
  createEmptyRequirement,
  createEmptyCreativeRef,
  createEmptyPortfolioLink,
  formatCurrency,
} from './types';
import type { RequirementAssignee } from '@/types/database';
import FormSelect from '@/components/ui/FormSelect';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import { IconPlus } from '@/components/ui/Icons';
import { X, ChevronDown, ChevronUp, Palette, Image as ImageIcon, FileText } from 'lucide-react';
import PhaseNarrativeEditor from './PhaseNarrativeEditor';

export type {    PhaseData } from './types';
import Button from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

interface PhaseEditorStepProps {
  phase: PhaseData;
  onChange: (phase: PhaseData) => void;
}

/* ─── Collapsible Section Wrapper ───────────────────────────────────── */

function Section({
  title,
  icon,
  count,
  accent = 'text-text-secondary',
  children,
  defaultOpen = false,
}: {
  title: string;
  icon?: React.ReactNode;
  count?: number;
  accent?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3 bg-bg-secondary/50 hover:bg-bg-secondary transition-colors text-left"
      >
        <span className="flex items-center gap-2">
          {icon}
          <span className={`text-sm font-medium ${accent}`}>{title}</span>
          {count !== undefined && count > 0 && (
            <span className="inline-flex items-center rounded-full bg-bg-secondary px-2 py-0.5 text-[11px] font-medium text-text-muted">
              {count}
            </span>
          )}
        </span>
        {open ? <ChevronUp size={14} className="text-text-muted" /> : <ChevronDown size={14} className="text-text-muted" />}
      </Button>
      {open && <div className="px-4 py-4 space-y-3">{children}</div>}
    </div>
  );
}


export default function PhaseEditorStep({ phase, onChange }: PhaseEditorStepProps) {
  const update = (partial: Partial<PhaseData>) => {
    onChange({ ...phase, ...partial });
  };

  // ─── Deliverables ────────────────────────────────────────────────────
  const addDeliverable = () => {
    update({ deliverables: [...phase.deliverables, createEmptyDeliverable()] });
  };

  const updateDeliverable = (index: number, partial: Partial<DeliverableData>) => {
    const updated = [...phase.deliverables];
    const item = { ...updated[index], ...partial };
    if ('qty' in partial || 'unitCost' in partial) {
      item.totalCost = item.qty * item.unitCost;
    }
    updated[index] = item;
    update({ deliverables: updated });
  };

  const removeDeliverable = (index: number) => {
    update({ deliverables: phase.deliverables.filter((_, i) => i !== index) });
  };

  // ─── Deliverable details sub-items ───────────────────────────────────
  const addDetail = (delivIndex: number) => {
    const updated = [...phase.deliverables];
    updated[delivIndex] = { ...updated[delivIndex], details: [...updated[delivIndex].details, ''] };
    update({ deliverables: updated });
  };

  const updateDetail = (delivIndex: number, detailIndex: number, value: string) => {
    const updated = [...phase.deliverables];
    const details = [...updated[delivIndex].details];
    details[detailIndex] = value;
    updated[delivIndex] = { ...updated[delivIndex], details };
    update({ deliverables: updated });
  };

  const removeDetail = (delivIndex: number, detailIndex: number) => {
    const updated = [...phase.deliverables];
    updated[delivIndex] = {
      ...updated[delivIndex],
      details: updated[delivIndex].details.filter((_, i) => i !== detailIndex),
    };
    update({ deliverables: updated });
  };

  // ─── Add-ons ────────────────────────────────────────────────────────
  const addAddon = () => {
    update({ addons: [...phase.addons, createEmptyAddon()] });
  };

  const updateAddon = (index: number, partial: Partial<AddonData>) => {
    const updated = [...phase.addons];
    const item = { ...updated[index], ...partial };
    if ('qty' in partial || 'unitCost' in partial) {
      item.totalCost = item.qty * item.unitCost;
    }
    updated[index] = item;
    update({ addons: updated });
  };

  const removeAddon = (index: number) => {
    update({ addons: phase.addons.filter((_, i) => i !== index) });
  };

  // ─── Creative References ─────────────────────────────────────────────
  const addCreativeRef = () => {
    update({ creativeRefs: [...phase.creativeRefs, createEmptyCreativeRef()] });
  };

  const updateCreativeRef = (index: number, partial: Partial<CreativeReferenceData>) => {
    const updated = [...phase.creativeRefs];
    updated[index] = { ...updated[index], ...partial };
    update({ creativeRefs: updated });
  };

  const removeCreativeRef = (index: number) => {
    update({ creativeRefs: phase.creativeRefs.filter((_, i) => i !== index) });
  };

  // ─── Portfolio Links ─────────────────────────────────────────────────
  const addPortfolioLink = () => {
    update({ portfolioLinks: [...phase.portfolioLinks, createEmptyPortfolioLink()] });
  };

  const updatePortfolioLink = (index: number, partial: Partial<PortfolioLinkData>) => {
    const updated = [...phase.portfolioLinks];
    updated[index] = { ...updated[index], ...partial };
    update({ portfolioLinks: updated });
  };

  const removePortfolioLink = (index: number) => {
    update({ portfolioLinks: phase.portfolioLinks.filter((_, i) => i !== index) });
  };

  // ─── Milestone ──────────────────────────────────────────────────────
  const addRequirement = () => {
    update({
      milestone: {
        ...phase.milestone,
        requirements: [...phase.milestone.requirements, createEmptyRequirement()],
      },
    });
  };

  const updateRequirement = (index: number, partial: Partial<MilestoneRequirementData>) => {
    const updated = [...phase.milestone.requirements];
    updated[index] = { ...updated[index], ...partial };
    update({ milestone: { ...phase.milestone, requirements: updated } });
  };

  const removeRequirement = (index: number) => {
    update({
      milestone: {
        ...phase.milestone,
        requirements: phase.milestone.requirements.filter((_, i) => i !== index),
      },
    });
  };

  // ─── Terms sections ─────────────────────────────────────────────────
  const addTermsSection = () => {
    update({ termsSections: [...phase.termsSections, ''] });
  };

  const updateTermsSection = (index: number, value: string) => {
    const updated = [...phase.termsSections];
    updated[index] = value;
    update({ termsSections: updated });
  };

  const removeTermsSection = (index: number) => {
    update({ termsSections: phase.termsSections.filter((_, i) => i !== index) });
  };

  // ─── Totals ──────────────────────────────────────────────────────────
  const deliverablesTotal = phase.deliverables.reduce((sum, d) => sum + d.totalCost, 0);
  const selectedAddonsTotal = phase.addons
    .filter((a) => a.selected)
    .reduce((sum, a) => sum + a.totalCost, 0);
  const phaseSubtotal = deliverablesTotal + selectedAddonsTotal;

  // ─── Expand state for deliverable detail rows ────────────────────────
  const [expandedDeliverable, setExpandedDeliverable] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      {/* Phase Header */}
      <div className="space-y-4">
        <div className="flex items-baseline gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-org-primary text-xs font-bold text-white">
            {phase.number}
          </span>
          <div className="flex-1 space-y-3">
            <FormInput
              type="text"
              value={phase.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="Phase Name" />
            <FormInput
              type="text"
              value={phase.subtitle}
              onChange={(e) => update({ subtitle: e.target.value })}
              placeholder="Phase Subtitle — e.g., Consultation + Brand Immersion + Vision Alignment" />
          </div>
        </div>
      </div>

      {/* Narrative */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <FormLabel>Narrative</FormLabel>
          <span className="text-[10px] text-text-muted">Rich text — formatting is for editing only</span>
        </div>
        <PhaseNarrativeEditor
          value={phase.narrative}
          onChange={(text) => update({ narrative: text })}
          placeholder="Tell the story of this phase. What is the purpose? What does the client experience? What is being created and why?"
        />
        <p className="mt-1 text-xs text-text-muted">This narrative appears in the client-facing proposal document.</p>
      </div>

      {/* Creative References */}
      <Section
        title="Creative Direction & References"
        icon={<Palette size={14} className="text-blue-500" />}
        count={phase.creativeRefs.length}
        accent="text-blue-600"
      >
        <p className="text-xs text-text-muted mb-3">
          Reference imagery, mood boards, and brand anchors that guide this phase. These will appear in the proposal document.
        </p>

        {phase.creativeRefs.map((ref, index) => (
          <div key={ref.id} className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50/30 px-4 py-3">
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <FormSelect
                  value={ref.type}
                  onChange={(e) => updateCreativeRef(index, { type: e.target.value as CreativeRefType })}
                >
                  {CREATIVE_REF_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </FormSelect>
                <FormInput
                  type="text"
                  value={ref.label}
                  onChange={(e) => updateCreativeRef(index, { label: e.target.value })}
                  placeholder="Label — e.g., Brand Campaign Anchor" />
              </div>
              <FormInput
                type="text"
                value={ref.description}
                onChange={(e) => updateCreativeRef(index, { description: e.target.value })}
                placeholder="Description — e.g., The key visual from the brand's current campaign that sets the tone" />
            </div>
            <Button type="button" onClick={() => removeCreativeRef(index)} className="mt-1 p-0.5 text-text-muted hover:text-error">
              <X size={14} />
            </Button>
          </div>
        ))}

        <Button type="button" onClick={addCreativeRef} className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
          <IconPlus size={14} />
          Add Creative Reference
        </Button>
      </Section>

      {/* Portfolio / Precedent Work */}
      <Section
        title="Portfolio & Precedent Work"
        icon={<ImageIcon size={14} className="text-amber-600" />}
        count={phase.portfolioLinks.length}
        accent="text-amber-700"
      >
        <p className="text-xs text-text-muted mb-3">
          Past projects that demonstrate relevant capabilities. These will appear as reference cards in the proposal.
        </p>

        {phase.portfolioLinks.map((link, index) => (
          <div key={link.id} className="flex items-start gap-3 rounded-lg border border-amber-100 bg-amber-50/30 px-4 py-3">
            <div className="flex-1 space-y-2">
              <FormInput
                type="text"
                value={link.label}
                onChange={(e) => updatePortfolioLink(index, { label: e.target.value })}
                placeholder="Project name — e.g., Netflix × Bridgerton Pop-Up" />
              <FormInput
                type="text"
                value={link.description}
                onChange={(e) => updatePortfolioLink(index, { description: e.target.value })}
                placeholder="Description — e.g., Ornate scenic concept with layered environmental storytelling" />
            </div>
            <Button type="button" onClick={() => removePortfolioLink(index)} className="mt-1 p-0.5 text-text-muted hover:text-error">
              <X size={14} />
            </Button>
          </div>
        ))}

        <Button type="button" onClick={addPortfolioLink} className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors">
          <IconPlus size={14} />
          Add Portfolio Reference
        </Button>
      </Section>

      {/* Deliverables Table */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">Deliverables</h3>

        {phase.deliverables.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table >
              <TableHeader>
                <TableRow className="bg-bg-secondary border-b border-border">
                  <TableHead className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-text-muted w-6" />
                  <TableHead className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Name</TableHead>
                  <TableHead className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Description</TableHead>
                  <TableHead className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-text-muted w-28">Category</TableHead>
                  <TableHead className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-text-muted w-24">Unit</TableHead>
                  <TableHead className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-text-muted w-16">Qty</TableHead>
                  <TableHead className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-text-muted w-24">Unit Cost</TableHead>
                  <TableHead className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-text-muted w-24">Total</TableHead>
                  <TableHead className="px-3 py-2 w-10" />
                </TableRow>
              </TableHeader>
              <TableBody >
                {phase.deliverables.map((d, index) => (
                  <>
                    <TableRow key={d.id} className="hover:bg-bg-secondary/50">
                      <TableCell className="px-3 py-2">
                        <Button
                          type="button"
                          onClick={() => setExpandedDeliverable(expandedDeliverable === d.id ? null : d.id)}
                          className="p-0.5 text-text-muted hover:text-foreground"
                          title="Toggle details"
                        >
                          {expandedDeliverable === d.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </Button>
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <FormInput
                          type="text"
                          value={d.name}
                          onChange={(e) => updateDeliverable(index, { name: e.target.value })}
                          placeholder="Item name" />
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <FormInput
                          type="text"
                          value={d.description}
                          onChange={(e) => updateDeliverable(index, { description: e.target.value })}
                          placeholder="Description" />
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <FormSelect
                          value={d.category}
                          onChange={(e) => updateDeliverable(index, { category: e.target.value })}
                        >
                          <option value="">--</option>
                          {CATEGORY_SUGGESTIONS.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </FormSelect>
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <FormSelect
                          value={d.unit}
                          onChange={(e) => updateDeliverable(index, { unit: e.target.value })}
                        >
                          {UNIT_OPTIONS.map((u) => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </FormSelect>
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <FormInput
                          type="number"
                          min={0}
                          value={d.qty}
                          onChange={(e) => updateDeliverable(index, { qty: Number(e.target.value) })} />
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <FormInput
                          type="number"
                          min={0}
                          step={0.01}
                          value={d.unitCost}
                          onChange={(e) => updateDeliverable(index, { unitCost: Number(e.target.value) })} />
                      </TableCell>
                      <TableCell className="px-3 py-2 text-right text-sm font-medium text-foreground">
                        {formatCurrency(d.totalCost)}
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <Button
                          type="button"
                          onClick={() => removeDeliverable(index)}
                          className="p-0.5 text-text-muted hover:text-error"
                        >
                          <X size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                    {/* Expandable details sub-rows */}
                    {expandedDeliverable === d.id && (
                      <TableRow key={`${d.id}-details`}>
                        <TableCell colSpan={9} className="px-6 py-3 bg-bg-secondary/30">
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-text-secondary">Specification Details</p>
                            {d.details.map((detail, dIdx) => (
                              <div key={dIdx} className="flex items-center gap-2">
                                <span className="text-text-muted text-xs">•</span>
                                <FormInput
                                  type="text"
                                  value={detail}
                                  onChange={(e) => updateDetail(index, dIdx, e.target.value)}
                                  placeholder="Detail / specification" />
                                <Button type="button" onClick={() => removeDetail(index, dIdx)} className="p-0.5 text-text-muted hover:text-error">
                                  <X size={12} />
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              onClick={() => addDetail(index)}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-text-secondary hover:text-org-primary transition-colors"
                            >
                              <IconPlus size={12} />
                              Add Detail
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
              <tfoot>
                <TableRow className="border-t border-border bg-bg-secondary">
                  <TableCell colSpan={7} className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-text-muted">
                    Deliverables Subtotal
                  </TableCell>
                  <TableCell className="px-3 py-2 text-right text-sm font-semibold text-foreground">
                    {formatCurrency(deliverablesTotal)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </tfoot>
            </Table>
          </div>
        )}

        <Button
          type="button"
          onClick={addDeliverable}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-org-primary transition-colors"
        >
          <IconPlus size={14} />
          Add Deliverable
        </Button>
      </div>

      {/* Add-ons Table */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-1">Options & Add-Ons</h3>
        <p className="text-xs text-text-muted mb-3">Optional items the client can select. Check the box to pre-select.</p>

        {phase.addons.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-addon/30">
            <Table >
              <TableHeader>
                <TableRow className="bg-addon-bg border-b border-addon/20">
                  <TableHead className="px-3 py-2 text-center text-xs font-medium uppercase tracking-wider text-addon w-10">On</TableHead>
                  <TableHead className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-addon">Name</TableHead>
                  <TableHead className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-addon">Description</TableHead>
                  <TableHead className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-addon w-24">Category</TableHead>
                  <TableHead className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-addon w-16">Qty</TableHead>
                  <TableHead className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-addon w-24">Unit Cost</TableHead>
                  <TableHead className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-addon w-24">Total</TableHead>
                  <TableHead className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-addon w-24">Excl. Group</TableHead>
                  <TableHead className="px-3 py-2 w-10" />
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-addon/10">
                {phase.addons.map((a, index) => (
                  <TableRow key={a.id} className={a.selected ? 'bg-addon-bg/50' : 'hover:bg-bg-secondary/50'}>
                    <TableCell className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={a.selected}
                        onChange={(e) => updateAddon(index, { selected: e.target.checked })}
                        className="rounded border-border text-addon focus:ring-addon"
                      />
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      <FormInput
                        type="text"
                        value={a.name}
                        onChange={(e) => updateAddon(index, { name: e.target.value })}
                        placeholder="Add-on name" />
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      <FormInput
                        type="text"
                        value={a.description}
                        onChange={(e) => updateAddon(index, { description: e.target.value })}
                        placeholder="Description" />
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      <FormSelect
                        value={a.category}
                        onChange={(e) => updateAddon(index, { category: e.target.value })}
                      >
                        <option value="">--</option>
                        {CATEGORY_SUGGESTIONS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </FormSelect>
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      <FormInput
                        type="number"
                        min={0}
                        value={a.qty}
                        onChange={(e) => updateAddon(index, { qty: Number(e.target.value) })} />
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      <FormInput
                        type="number"
                        min={0}
                        step={0.01}
                        value={a.unitCost}
                        onChange={(e) => updateAddon(index, { unitCost: Number(e.target.value) })} />
                    </TableCell>
                    <TableCell className="px-3 py-2 text-right text-sm font-medium text-foreground">
                      {formatCurrency(a.totalCost)}
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      <FormInput
                        type="text"
                        value={a.mutuallyExclusiveGroup}
                        onChange={(e) => updateAddon(index, { mutuallyExclusiveGroup: e.target.value })}
                        placeholder="Group" />
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      <Button
                        type="button"
                        onClick={() => removeAddon(index)}
                        className="p-0.5 text-text-muted hover:text-error"
                      >
                        <X size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Button
          type="button"
          onClick={addAddon}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-addon transition-colors"
        >
          <IconPlus size={14} />
          Add Add-on
        </Button>
      </div>

      {/* Contractual Framework / Terms Sections */}
      <Section
        title="Contractual Framework"
        icon={<FileText size={14} className="text-purple-500" />}
        count={phase.termsSections.length}
        accent="text-purple-600"
      >
        <p className="text-xs text-text-muted mb-3">
          Reference specific sections of your Master Terms & Conditions that govern this phase.
        </p>

        {phase.termsSections.map((section, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-purple-500 text-xs font-medium">§</span>
            <FormInput
              type="text"
              value={section}
              onChange={(e) => updateTermsSection(index, e.target.value)}
              placeholder="e.g., 2.1 (Creative Design), 9.3 (Artwork Approval)" />
            <Button type="button" onClick={() => removeTermsSection(index)} className="p-0.5 text-text-muted hover:text-error">
              <X size={12} />
            </Button>
          </div>
        ))}

        <Button type="button" onClick={addTermsSection} className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:text-purple-700 transition-colors">
          <IconPlus size={14} />
          Add Terms Reference
        </Button>
      </Section>

      {/* Milestone Gate */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-1">Milestone Gate</h3>
        <p className="text-xs text-text-muted mb-3">Requirements that must be met before proceeding to the next phase.</p>

        <div className="rounded-lg border border-milestone/30 bg-milestone-bg/30 px-5 py-4 space-y-4">
          <div>
            <FormLabel>Milestone Name</FormLabel>
            <FormInput
              type="text"
              value={phase.milestone.name}
              onChange={(e) =>
                update({ milestone: { ...phase.milestone, name: e.target.value } })
              }
              placeholder="e.g., CREATIVE BRIEF SIGN-OFF" />
          </div>

          <div>
            <FormLabel>Unlocks</FormLabel>
            <FormInput
              type="text"
              value={phase.milestone.unlocks}
              onChange={(e) =>
                update({ milestone: { ...phase.milestone, unlocks: e.target.value } })
              }
              placeholder="e.g., Phase 02: Concept Design & Visualization" />
          </div>

          {phase.milestone.requirements.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-text-secondary">Requirements</p>
              {phase.milestone.requirements.map((req, index) => (
                <div key={req.id} className="flex items-center gap-3">
                  <FormInput
                    type="text"
                    value={req.text}
                    onChange={(e) => updateRequirement(index, { text: e.target.value })}
                    placeholder="Requirement description" />
                  <FormSelect
                    value={req.assignee}
                    onChange={(e) =>
                      updateRequirement(index, {
                        assignee: e.target.value as RequirementAssignee,
                      })
                    }
                  >
                    {ASSIGNEE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </FormSelect>
                  <Button
                    type="button"
                    onClick={() => removeRequirement(index)}
                    className="p-0.5 text-text-muted hover:text-error"
                  >
                    <X size={14} />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button
            type="button"
            onClick={addRequirement}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-milestone hover:text-milestone/80 transition-colors"
          >
            <IconPlus size={14} />
            Add Requirement
          </Button>
        </div>
      </div>

      {/* Phase Subtotal */}
      <div className="rounded-lg bg-bg-secondary px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Phase {phase.number} Subtotal</p>
          <p className="text-xs text-text-muted">
            Deliverables: {formatCurrency(deliverablesTotal)}
            {selectedAddonsTotal > 0 && ` + Add-ons: ${formatCurrency(selectedAddonsTotal)}`}
          </p>
        </div>
        <p className="text-xl font-semibold text-foreground">{formatCurrency(phaseSubtotal)}</p>
      </div>
    </div>
  );
}
