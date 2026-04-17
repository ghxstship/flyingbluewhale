'use client';

import { LOCATION_TYPE_ICONS, LOCATION_TYPE_LABELS, type LocationType } from '@/lib/supabase/types';

export interface LocationOption {
  id: string;
  name: string;
  type: string;
  parent_id: string | null;
  is_active: boolean;
  address?: Record<string, string> | null;
}

interface LocationPickerProps {
  locations: LocationOption[];
  value?: string | null;
  onChange?: (id: string | null) => void;
  name?: string;
  placeholder?: string;
  filterType?: LocationType | LocationType[];
  required?: boolean;
  disabled?: boolean;
}

export default function LocationPicker({
  locations,
  value,
  onChange,
  name = 'location_id',
  placeholder = 'Select location…',
  filterType,
  required = false,
  disabled = false,
}: LocationPickerProps) {
  const typeFilter = filterType
    ? Array.isArray(filterType) ? filterType : [filterType]
    : null;

  // Build hierarchy: top-level locations and their children
  const topLevel = locations.filter((l) => !l.parent_id && l.is_active && (!typeFilter || typeFilter.includes(l.type as LocationType)));
  const children = (parentId: string) =>
    locations.filter((l) => l.parent_id === parentId && l.is_active && (!typeFilter || typeFilter.includes(l.type as LocationType)));

  // For flat mode (when filtering by type), show all matching
  const flatMatches = typeFilter
    ? locations.filter((l) => l.is_active && typeFilter.includes(l.type as LocationType))
    : null;

  const useFlat = flatMatches && flatMatches.length > 0 && topLevel.length === 0;
  const displayLocations = useFlat ? flatMatches! : topLevel;

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '0.5rem',
    color: 'var(--color-text-primary)',
    fontSize: '0.8125rem',
    fontFamily: 'var(--font-body)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' stroke='%239CA3AF' fill='none' stroke-width='1.5'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.75rem center',
    paddingRight: '2rem',
  };

  return (
    <select
      name={name}
      value={value || ''}
      onChange={(e) => onChange?.(e.target.value || null)}
      required={required}
      disabled={disabled}
      style={selectStyle}
    >
      <option value="">{placeholder}</option>
      {displayLocations.map((loc) => {
        const icon = LOCATION_TYPE_ICONS[loc.type as LocationType] || '📌';
        const label = LOCATION_TYPE_LABELS[loc.type as LocationType] || loc.type;
        const addr = loc.address as Record<string, string> | null;
        const city = addr?.city ? ` · ${addr.city}` : '';
        const kids = children(loc.id);
        return (
          <optgroup key={loc.id} label={`${icon} ${loc.name}${city}`}>
            <option value={loc.id}>{icon} {loc.name} ({label}){city}</option>
            {kids.map((child) => {
              const ci = LOCATION_TYPE_ICONS[child.type as LocationType] || '📌';
              const cl = LOCATION_TYPE_LABELS[child.type as LocationType] || child.type;
              return (
                <option key={child.id} value={child.id}>
                  {'  '}↳ {ci} {child.name} ({cl})
                </option>
              );
            })}
          </optgroup>
        );
      })}
    </select>
  );
}
