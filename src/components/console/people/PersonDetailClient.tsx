'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import PersonEditModal from '@/components/console/people/PersonEditModal';

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

interface PersonDetailClientProps {
  person: PersonRecord;
  onUpdated?: () => void;
}

export default function PersonDetailClient({ person, onUpdated }: PersonDetailClientProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <>
      <div className="flex justify-end -mt-16 mb-8 relative z-10">
        <Button onClick={() => setIsEditModalOpen(true)}>
          Edit Profile
        </Button>
      </div>

      {isEditModalOpen && (
        <PersonEditModal 
          open={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          person={person}
          onSaved={() => {
            if (onUpdated) onUpdated();
            window.location.reload(); 
          }}
        />
      )}
    </>
  );
}
