'use client';

/** ViewBar — saved view tabs with create/delete actions */

interface ViewBarView {
  id: string;
  name: string;
  display_type: string;
  config?: any;
  is_default?: boolean;
}

interface CreateViewOpts {
  name: string;
  display_type: string;
  inherit?: boolean;
}

interface ViewBarProps {
  views: ViewBarView[];
  activeViewId: string;
  onSelectView: (id: string) => void;
  onCreateView: (opts: CreateViewOpts) => void;
  onDeleteView?: (id: string) => void;
  onDuplicateView?: (id: string) => void;
  children?: React.ReactNode;
}

export function ViewBar({ views, activeViewId, onSelectView, children }: ViewBarProps) {
  return (
    <div className="flex items-center gap-2" data-component="ViewBar">
      {views.map((v) => (
        <button
          key={v.id}
          onClick={() => onSelectView(v.id)}
          className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
            v.id === activeViewId
              ? 'bg-surface-hover text-text-primary'
              : 'text-text-disabled hover:text-text-secondary'
          }`}
        >
          {v.name}
        </button>
      ))}
      {children}
    </div>
  );
}
export default ViewBar;
