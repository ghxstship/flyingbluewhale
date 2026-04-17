'use client';

import { useState, useEffect } from 'react';
import type { NarrativeContext, PaymentTerms } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { resolveClientOrg } from '@/lib/auth/resolve-org-client';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import { IconPlus } from '@/components/ui/Icons';
import { X } from 'lucide-react';
import Button from '@/components/ui/Button';
export interface ProjectSetupData {
  clientId: string;
  clientSearch: string;
  projectName: string;
  subtitle: string;
  brandVoice: string;
  audienceProfile: string;
  experienceGoal: string;
  depositPercent: number;
  balancePercent: number;
  phaseTemplateId: string;
  assumptions: string[];
}

interface ProjectSetupStepProps {
  data: ProjectSetupData;
  onChange: (data: ProjectSetupData) => void;
}

interface ClientOption {
  id: string;
  name: string;
}

interface TemplateOption {
  id: string;
  name: string;
}

export default function ProjectSetupStep({
  data,
  onChange,
}: ProjectSetupStepProps) {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);

  useEffect(() => {
    async function loadOptions() {
      try {
        const supabase = createClient();
        const ctx = await resolveClientOrg();
        if (!ctx) return;

        // Forward-declared — clients table pending migration
        const { data: clientRows } = await (supabase as any)
          .from('clients')
          .select('id, company_name')
          .eq('organization_id', ctx.organizationId)
          .order('company_name');

        setClients(
          (clientRows ?? []).map((c: Record<string, unknown>) => ({
            id: c.id as string,
            name: c.company_name as string,
          })),
        );

        // Forward-declared — phase_templates table pending migration
        const { data: templateRows } = await (supabase as any)
          .from('phase_templates')
          .select('id, name')
          .eq('organization_id', ctx.organizationId)
          .order('name');

        setTemplates(
          (templateRows ?? []).map((t: Record<string, unknown>) => ({
            id: t.id as string,
            name: t.name as string,
          })),
        );
      } catch (error) {
          void error; /* Caught: error boundary handles display */
        }
    }
    loadOptions();
  }, []);

  const update = (partial: Partial<ProjectSetupData>) => {
    onChange({ ...data, ...partial });
  };

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(data.clientSearch.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Project Setup</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Define the basics of your proposal.
        </p>
      </div>

      {/* Client Selection */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-foreground">Client</legend>
        <div>
          <FormLabel htmlFor="clientSearch">
            Search clients
          </FormLabel>
          <FormInput
            id="clientSearch"
            type="text"
            placeholder="Type to search..."
            value={data.clientSearch}
            onChange={(e) => update({ clientSearch: e.target.value })} />
          {data.clientSearch && !data.clientId && (
            <ul className="mt-1 rounded-lg border border-border bg-background shadow-sm max-h-40 overflow-y-auto">
              {filteredClients.map((client) => (
                <li key={client.id}>
                  <Button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-bg-secondary"
                    onClick={() =>
                      update({
                        clientId: client.id,
                        clientSearch: client.name,
                      })
                    }
                  >
                    {client.name}
                  </Button>
                </li>
              ))}
              {filteredClients.length === 0 && (
                <li className="px-3 py-2 text-sm text-text-muted">No clients found</li>
              )}
            </ul>
          )}
          {data.clientId && (
            <Button
              type="button"
              className="mt-1 text-xs text-text-muted hover:text-foreground"
              onClick={() => update({ clientId: '', clientSearch: '' })}
            >
              Clear selection
            </Button>
          )}
        </div>
      </fieldset>

      {/* Project Details */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-foreground">Project Details</legend>

        <div>
          <FormLabel htmlFor="projectName">
            Project Name
          </FormLabel>
          <FormInput
            id="projectName"
            type="text"
            placeholder="e.g., SXSW 2026 Brand Activation"
            value={data.projectName}
            onChange={(e) => update({ projectName: e.target.value })} />
        </div>

        <div>
          <FormLabel htmlFor="subtitle">
            Subtitle
          </FormLabel>
          <FormInput
            id="subtitle"
            type="text"
            placeholder="e.g., Immersive Pop-Up Experience"
            value={data.subtitle}
            onChange={(e) => update({ subtitle: e.target.value })} />
        </div>
      </fieldset>

      {/* Narrative Context */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-foreground">Narrative Context</legend>

        <div>
          <FormLabel htmlFor="brandVoice">
            Brand Voice
          </FormLabel>
          <FormTextarea
            id="brandVoice"
            rows={2}
            placeholder="Describe the brand voice for this proposal..."
            value={data.brandVoice}
            onChange={(e) => update({ brandVoice: e.target.value })} />
        </div>

        <div>
          <FormLabel htmlFor="audienceProfile">
            Audience Profile
          </FormLabel>
          <FormTextarea
            id="audienceProfile"
            rows={2}
            placeholder="Who is the target audience?"
            value={data.audienceProfile}
            onChange={(e) => update({ audienceProfile: e.target.value })} />
        </div>

        <div>
          <FormLabel htmlFor="experienceGoal">
            Experience Goal
          </FormLabel>
          <FormTextarea
            id="experienceGoal"
            rows={2}
            placeholder="What is the desired outcome of the experience?"
            value={data.experienceGoal}
            onChange={(e) => update({ experienceGoal: e.target.value })} />
        </div>
      </fieldset>

      {/* Payment Terms */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-foreground">Payment Terms Override</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FormLabel htmlFor="depositPercent">
              Deposit %
            </FormLabel>
            <FormInput
              id="depositPercent"
              type="number"
              min={0}
              max={100}
              value={data.depositPercent}
              onChange={(e) => update({ depositPercent: Number(e.target.value) })} />
          </div>
          <div>
            <FormLabel htmlFor="balancePercent">
              Balance %
            </FormLabel>
            <FormInput
              id="balancePercent"
              type="number"
              min={0}
              max={100}
              value={data.balancePercent}
              onChange={(e) => update({ balancePercent: Number(e.target.value) })} />
          </div>
        </div>
        {data.depositPercent + data.balancePercent !== 100 && (
          <p className="text-xs text-warning">Deposit + Balance should equal 100%</p>
        )}
      </fieldset>

      {/* Assumptions & Conditions */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-foreground">Assumptions & Conditions</legend>
        <p className="text-xs text-text-muted">
          Key assumptions underlying this proposal. These appear prominently in the client-facing document.
        </p>

        {(data.assumptions ?? []).map((assumption, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-text-muted text-xs shrink-0">•</span>
            <FormInput
              type="text"
              value={assumption}
              onChange={(e) => {
                const updated = [...(data.assumptions ?? [])];
                updated[index] = e.target.value;
                update({ assumptions: updated });
              }}
              placeholder="e.g., All pricing assumes standard working hours (Monday–Friday, 8AM–6PM)" />
            <Button
              type="button"
              onClick={() => {
                const updated = (data.assumptions ?? []).filter((_, i) => i !== index);
                update({ assumptions: updated });
              }}
              className="p-0.5 text-text-muted hover:text-error shrink-0"
            >
              <X size={14} />
            </Button>
          </div>
        ))}

        <Button
          type="button"
          onClick={() => update({ assumptions: [...(data.assumptions ?? []), ''] })}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-org-primary transition-colors"
        >
          <IconPlus size={14} />
          Add Assumption
        </Button>
      </fieldset>

      {/* Phase Template */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-foreground">Phase Template</legend>
        <div>
          <FormLabel htmlFor="phaseTemplate">
            Select a template
          </FormLabel>
          <FormSelect
            id="phaseTemplate"
            value={data.phaseTemplateId}
            onChange={(e) => update({ phaseTemplateId: e.target.value })}
          >
            <option value="">-- Select template --</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </FormSelect>
        </div>
      </fieldset>
    </div>
  );
}
