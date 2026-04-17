export default function PlatformLoading() {
  return (
    <div className="p-8 w-full max-w-7xl mx-auto animate-pulse flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-surface-elevated rounded w-1/4" />
        <div className="h-8 bg-surface-elevated rounded w-32" />
      </div>
      <div className="h-px bg-border w-full" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-6 flex flex-col gap-4">
            <div className="h-6 bg-surface-elevated rounded w-1/2" />
            <div className="h-4 bg-surface-elevated rounded w-full" />
            <div className="h-4 bg-surface-elevated rounded w-3/4" />
          </div>
        ))}
      </div>
      <div className="card p-6 h-64 flex flex-col justify-center items-center gap-4">
        <div className="w-8 h-8 border-2 border-cyan/20 border-t-cyan rounded-full animate-spin" />
        <p className="text-label text-secondary">Loading Platform Data...</p>
      </div>
    </div>
  );
}
