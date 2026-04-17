'use client';

import FormSelect from '@/components/ui/FormSelect';
import { IconPlus } from '@/components/ui/Icons';
import { X } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

export interface TeamAssignmentData {
  id: string;
  role: string;
  userId: string;
  facilityId: string;
}

interface TeamStepProps {
  assignments: TeamAssignmentData[];
  onChange: (assignments: TeamAssignmentData[]) => void;
}

const COMMON_ROLES = [
  'Account Lead',
  'Project Manager',
  'Design Lead',
  'Fabrication Lead',
  'Install Lead',
  'Creative Director',
  'Production Coordinator',
  'Site Supervisor',
  'AV Technician',
  'Logistics Coordinator',
];

// Seed data
const SEED_TEAM_MEMBERS = [
  { id: 'user-1', name: 'Sarah Chen', title: 'Sr. Project Manager' },
  { id: 'user-2', name: 'Marcus Rivera', title: 'Design Director' },
  { id: 'user-3', name: 'James O\'Brien', title: 'Fabrication Manager' },
  { id: 'user-4', name: 'Priya Patel', title: 'Install Supervisor' },
  { id: 'user-5', name: 'Alex Kim', title: 'Account Executive' },
  { id: 'user-6', name: 'Dana Moretti', title: 'Creative Director' },
];

const SEED_FACILITIES = [
  { id: 'fac-1', name: 'HQ - Los Angeles' },
  { id: 'fac-2', name: 'Workshop - Austin' },
  { id: 'fac-3', name: 'Studio - New York' },
];

function createEmptyAssignment(): TeamAssignmentData {
  return {
    id: crypto.randomUUID(),
    role: '',
    userId: '',
    facilityId: '',
  };
}

export default function TeamStep({ assignments, onChange }: TeamStepProps) {
  const addAssignment = () => {
    onChange([...assignments, createEmptyAssignment()]);
  };

  const updateAssignment = (index: number, partial: Partial<TeamAssignmentData>) => {
    const updated = [...assignments];
    updated[index] = { ...updated[index], ...partial };
    onChange(updated);
  };

  const removeAssignment = (index: number) => {
    onChange(assignments.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Team Assignments</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Assign team members to roles on this project.
        </p>
      </div>

      {assignments.length === 0 && (
        <EmptyState message="No team assignments yet" className="border-0 shadow-none px-2 py-8" />
      )}

      {assignments.length > 0 && (
        <div className="overflow-x-auto">
          <Table >
            <TableHeader>
              <TableRow className="border-b border-border">
                <TableHead className="pb-2 pr-4 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                  Role
                </TableHead>
                <TableHead className="pb-2 pr-4 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                  Team Member
                </TableHead>
                <TableHead className="pb-2 pr-4 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                  Facility
                </TableHead>
                <TableHead className="pb-2 w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody >
              {assignments.map((assignment, index) => (
                <TableRow key={assignment.id}>
                  <TableCell className="py-3 pr-4">
                    <FormSelect
                      value={assignment.role}
                      onChange={(e) => updateAssignment(index, { role: e.target.value })}
                    >
                      <option value="">Select role...</option>
                      {COMMON_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </FormSelect>
                  </TableCell>
                  <TableCell className="py-3 pr-4">
                    <FormSelect
                      value={assignment.userId}
                      onChange={(e) => updateAssignment(index, { userId: e.target.value })}
                    >
                      <option value="">Select member...</option>
                      {SEED_TEAM_MEMBERS.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} — {member.title}
                        </option>
                      ))}
                    </FormSelect>
                  </TableCell>
                  <TableCell className="py-3 pr-4">
                    <FormSelect
                      value={assignment.facilityId}
                      onChange={(e) => updateAssignment(index, { facilityId: e.target.value })}
                    >
                      <option value="">Select facility...</option>
                      {SEED_FACILITIES.map((fac) => (
                        <option key={fac.id} value={fac.id}>
                          {fac.name}
                        </option>
                      ))}
                    </FormSelect>
                  </TableCell>
                  <TableCell className="py-3">
                    <Button
                      type="button"
                      onClick={() => removeAssignment(index)}
                      className="p-1 text-text-muted hover:text-error"
                      title="Remove"
                    >
                      <X size={16} />
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
        onClick={addAssignment}
        className="inline-flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2 text-sm font-medium text-text-secondary hover:border-org-primary hover:text-org-primary transition-colors"
      >
        <IconPlus size={16} />
        Add Assignment
      </Button>
    </div>
  );
}
