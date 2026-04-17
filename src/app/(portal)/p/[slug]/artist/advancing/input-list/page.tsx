import Link from 'next/link';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `Input List -- ${slug} -- GVTEWAY` };
}

type ChannelRow = {
  ch: number;
  source: string;
  mic: string;
  stand: string;
  notes: string;
};

const INPUT_COLUMNS: DataTableColumn<ChannelRow>[] = [
  {
    key: 'ch',
    header: 'CH',
    render: (c) => <span className="font-mono text-cyan text-sm">{c.ch}</span>,
  },
  {
    key: 'source',
    header: 'Source',
    render: (c) => <Input className="w-full h-8 text-sm px-2" defaultValue={c.source} />,
  },
  {
    key: 'mic',
    header: 'Mic / DI',
    render: (c) => <Input className="w-full h-8 text-sm px-2" defaultValue={c.mic} />,
  },
  {
    key: 'stand',
    header: 'Stand',
    render: (c) => <Input className="w-full h-8 text-sm px-2" defaultValue={c.stand} />,
  },
  {
    key: 'notes',
    header: 'Notes',
    render: (c) => <Input className="w-full h-8 text-sm px-2" defaultValue={c.notes} />,
  },
  {
    key: 'actions',
    header: '',
    align: 'right',
    render: () => <Button variant="ghost" size="sm" className="text-error h-8 w-8 p-0 flex items-center justify-center">×</Button>,
  },
];

export default async function InputListPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const defaultChannels: ChannelRow[] = [
    { ch: 1, source: 'CDJ L', mic: 'Line', stand: '-', notes: 'Stereo pair L from mixer' },
    { ch: 2, source: 'CDJ R', mic: 'Line', stand: '-', notes: 'Stereo pair R from mixer' },
  ];

  return (
    <>
      <ModuleHeader
        title="Input List"
        subtitle="Audio inputs per act. DJ acts default to 2-channel stereo line."
        backHref={`/${slug}/artist/advancing`}
        backLabel="Advancing"
        maxWidth="6xl"
      />

      <div className="page-content" style={{ maxWidth: '6xl' }}>
        <div className="card-elevated p-4 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="muted">Draft</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm">Add Channel</Button>
            <Button variant="primary" size="sm">Submit</Button>
          </div>
        </div>

        <DataTable
          columns={INPUT_COLUMNS}
          data={defaultChannels}
          emptyText="No input channels defined."
        />
      </div>
    </>
  );
}
