import Link from 'next/link';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `Input List -- ${slug} -- GVTEWAY` };
}

export default async function InputListPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const defaultChannels = [
    { ch: 1, source: 'CDJ L', mic: 'Line', stand: '-', notes: 'Stereo pair L from mixer' },
    { ch: 2, source: 'CDJ R', mic: 'Line', stand: '-', notes: 'Stereo pair R from mixer' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <Link href={`/${slug}/artist/advancing`} className="text-label text-cyan hover:text-cyan-bright transition-colors mb-2 block">&larr; Advancing</Link>
          <h1 className="text-display text-3xl text-text-primary">Input List</h1>
          <p className="text-sm text-text-secondary mt-1">Audio inputs per act. DJ acts default to 2-channel stereo line.</p>
        </div>
      </header>

      <div className="flex-1 px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="card-elevated p-4 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="badge border text-draft border-draft/30 bg-draft/10">Draft</span>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-ghost text-xs py-2 px-4">Add Channel</button>
              <button className="btn btn-primary text-xs py-2 px-6">Submit</button>
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th className="w-12">CH</th>
                <th>Source</th>
                <th className="w-24">Mic / DI</th>
                <th className="w-24">Stand</th>
                <th>Notes</th>
                <th className="w-16" />
              </tr>
            </thead>
            <tbody>
              {defaultChannels.map((ch) => (
                <tr key={ch.ch}>
                  <td><span className="text-mono text-cyan">{ch.ch}</span></td>
                  <td><input className="input w-full text-sm py-1" defaultValue={ch.source} /></td>
                  <td><input className="input w-full text-sm py-1" defaultValue={ch.mic} /></td>
                  <td><input className="input w-full text-sm py-1" defaultValue={ch.stand} /></td>
                  <td><input className="input w-full text-sm py-1" defaultValue={ch.notes} /></td>
                  <td><button className="btn btn-ghost text-xs text-error py-1">×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
