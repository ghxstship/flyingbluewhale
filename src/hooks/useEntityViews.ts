'use client';

import { useState, useCallback } from 'react';

/** useEntityViews — manages saved views for list pages */
interface ViewConfig {
  columns?: any;
  filters?: any;
  sort?: any;
  [key: string]: any;
}

interface EntityView {
  id: string;
  name: string;
  display_type: string;
  config: ViewConfig;
  is_default?: boolean;
}

export function useEntityViews({ entityType }: { entityType: string }) {
  const [views, setViews] = useState<EntityView[]>([
    { id: 'default', name: 'Default', display_type: 'table', config: {}, is_default: true },
  ]);
  const [activeViewId, setActiveViewId] = useState('default');

  const activeView = views.find((v) => v.id === activeViewId) ?? views[0];

  const createView = useCallback((opts: { name: string; display_type: string; config?: any }) => {
    const newView: EntityView = {
      id: `view-${Date.now()}`,
      name: opts.name,
      display_type: opts.display_type,
      config: opts.config ?? {},
    };
    setViews((prev) => [...prev, newView]);
    setActiveViewId(newView.id);
  }, []);

  const updateView = useCallback((id: string, updates: Partial<EntityView>) => {
    setViews((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v)));
  }, []);

  const deleteView = useCallback((id: string) => {
    setViews((prev) => prev.filter((v) => v.id !== id));
    setActiveViewId('default');
  }, []);

  const duplicateView = useCallback((id: string) => {
    const source = views.find((v) => v.id === id);
    if (!source) return;
    createView({ name: `${source.name} (copy)`, display_type: source.display_type, config: { ...source.config } });
  }, [views, createView]);

  return { views, activeView, activeViewId, setActiveViewId, createView, updateView, deleteView, duplicateView };
}

export default useEntityViews;
