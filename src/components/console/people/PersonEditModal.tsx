'use client';

import { useState, type FormEvent } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormInput from '@/components/ui/FormInput';
import FormSelect from '@/components/ui/FormSelect';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

type PersonRecord = {
  id: string;
  full_name?: string | null;
  title?: string | null;
  role?: string | null;
  rate_card?: string | null;
  phone?: string | null;
  department?: string | null;
  employment_type?: string | null;
  start_date?: string | null;
  hourly_cost?: number | string | null;
  email?: string | null;
};

interface PersonEditModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  person: PersonRecord;
}

const ROLES = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'controller', label: 'Controller' },
  { value: 'collaborator', label: 'Collaborator' },
  { value: 'client', label: 'Client' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'crew', label: 'Crew' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'community', label: 'Community' },
] as const;

export default function PersonEditModal({ open, onClose, onSaved, person }: PersonEditModalProps) {
  const [fullName, setFullName] = useState(person?.full_name || '');
  const [title, setTitle] = useState(person?.title || '');
  const [role, setRole] = useState(person?.role || 'collaborator');
  const [rateCard, setRateCard] = useState(person?.rate_card || '');
  const [phone, setPhone] = useState(person?.phone || '');
  const [department, setDepartment] = useState(person?.department || '');
  const [employmentType, setEmploymentType] = useState(person?.employment_type || 'full_time');
  const [startDate, setStartDate] = useState(person?.start_date || '');
  const [hourlyCost, setHourlyCost] = useState(person?.hourly_cost || '');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/settings/team/${person.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          title: title || null,
          role,
          rate_card: rateCard || null,
          phone: phone || null,
          department: department || null,
          employment_type: employmentType || null,
          start_date: startDate || null,
          hourly_cost: hourlyCost ? parseFloat(String(hourlyCost)) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update team member');
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell open={open} onClose={onClose} title="Edit Team Member">
      {error && <Alert className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
        <div>
          <FormLabel>Full Name *</FormLabel>
          <FormInput type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>

        <div>
          <FormLabel>Email</FormLabel>
          <FormInput type="email" disabled value={person?.email || ''} />
          <p className="mt-1 text-xs text-text-muted">Email cannot be changed after account creation.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Role</FormLabel>
            <FormSelect value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </FormSelect>
          </div>
          <div>
            <FormLabel>Title</FormLabel>
            <FormInput type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Senior Designer" />
          </div>
          <div>
            <FormLabel>Department</FormLabel>
            <FormInput type="text" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Engineering" />
          </div>
          <div>
            <FormLabel>Employment Type</FormLabel>
            <FormSelect value={employmentType} onChange={(e) => setEmploymentType(e.target.value)}>
              <option value="full_time">Full Time</option>
              <option value="part_time">Part Time</option>
              <option value="contractor">Contractor</option>
            </FormSelect>
          </div>
          <div>
            <FormLabel>Start Date</FormLabel>
            <FormInput type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <FormLabel>Phone</FormLabel>
            <FormInput type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1..." />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Rate Card</FormLabel>
            <FormInput type="text" value={rateCard} onChange={(e) => setRateCard(e.target.value)} placeholder="e.g. Rate Card A" />
          </div>
          <div>
            <FormLabel>Internal Hourly Cost</FormLabel>
            <FormInput type="number" step="0.01" value={hourlyCost} onChange={(e) => setHourlyCost(e.target.value)} placeholder="50.00" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border sticky bottom-0 bg-background/95 backdrop-blur-sm py-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>
            {submitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
