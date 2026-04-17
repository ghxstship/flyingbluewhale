import { ModuleHeader } from '@/components/layout/ModuleHeader';
import PeopleGrid from '@/components/console/people/PeopleGrid';

export default async function PeoplePage() {
  const mockPeople = [
    {
      id: '1',
      first_name: 'Julian',
      last_name: 'Clarkson',
      full_name: 'Julian Clarkson',
      title: 'Head of Product',
      department: 'Engineering',
      employment_type: 'W2',
      status: 'active'
    }
  ] as any;

  return (
    <>
      <ModuleHeader 
        title="People & Org" 
        subtitle="Manage workloads, org charts, and time-off tracking." 
      />
      <div className="p-6 h-[calc(100vh-140px)]">
        <PeopleGrid members={mockPeople} />
      </div>
    </>
  );
}
