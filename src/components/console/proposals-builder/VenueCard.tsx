'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { Address, VenueActivationDates, VenueLoadInStrike } from '@/types/database';
import FormTextarea from '@/components/ui/FormTextarea';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import Button from '@/components/ui/Button';

export interface VenueData {
  id: string;
  name: string;
  address: Address;
  type: string;
  activationDates: VenueActivationDates | null;
  loadIn: VenueLoadInStrike | null;
  strike: VenueLoadInStrike | null;
  hasLoadIn: boolean;
  hasStrike: boolean;
  notes: string;
}

const VENUE_TYPE_SUGGESTIONS = [
  'Convention Center',
  'Hotel Ballroom',
  'Outdoor Festival',
  'Retail Space',
  'Pop-Up',
  'Arena',
  'Warehouse',
  'Rooftop',
  'Gallery',
  'Restaurant',
];

/**
 * Individual venue card with expandable form for
 * address, activation dates, load-in/strike, and notes.
 */
export default function VenueCard({
  venue,
  index,
  onUpdate,
  onRemove,
}: {
  venue: VenueData;
  index: number;
  onUpdate: (venue: VenueData) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [showTypeSuggestions, setShowTypeSuggestions] = useState(false);

  const updateAddress = (partial: Partial<Address>) => {
    onUpdate({ ...venue, address: { ...venue.address, ...partial } });
  };

  const filteredSuggestions = VENUE_TYPE_SUGGESTIONS.filter((s) =>
    s.toLowerCase().includes(venue.type.toLowerCase())
  );

  return (
    <div className="rounded-xl border border-border bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <Button
          type="button"
          className="flex items-center gap-2 text-sm font-medium text-foreground"
          onClick={() => setExpanded(!expanded)}
        >
          <ChevronRight
            size={16}
            className={`text-text-muted transition-transform ${expanded ? 'rotate-90' : ''}`}
          />
          Venue {index + 1}{venue.name ? `: ${venue.name}` : ''}
        </Button>
        <Button
          type="button"
          onClick={onRemove}
          className="text-xs text-text-muted hover:text-error"
        >
          Remove
        </Button>
      </div>

      {/* Body */}
      {expanded && (
        <div className="px-5 py-4 space-y-4">
          {/* Name & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FormLabel>
                Venue Name
              </FormLabel>
              <FormInput
                type="text"
                placeholder="e.g., Austin Convention Center"
                value={venue.name}
                onChange={(e) => onUpdate({ ...venue, name: e.target.value })} />
            </div>
            <div className="relative">
              <FormLabel>
                Venue Type
              </FormLabel>
              <FormInput
                type="text"
                placeholder="e.g., Convention Center"
                value={venue.type}
                onChange={(e) => {
                  onUpdate({ ...venue, type: e.target.value });
                  setShowTypeSuggestions(true);
                }}
                onFocus={() => setShowTypeSuggestions(true)}
                onBlur={() => setTimeout(() => setShowTypeSuggestions(false), 150)} />
              {showTypeSuggestions && venue.type && filteredSuggestions.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-background shadow-sm max-h-32 overflow-y-auto">
                  {filteredSuggestions.map((s) => (
                    <li key={s}>
                      <Button
                        type="button"
                        className="w-full px-3 py-1.5 text-left text-sm hover:bg-bg-secondary"
                        onMouseDown={() => {
                          onUpdate({ ...venue, type: s });
                          setShowTypeSuggestions(false);
                        }}
                      >
                        {s}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Address */}
          <div>
            <FormLabel>Street</FormLabel>
            <FormInput
              type="text"
              value={venue.address.street ?? ''}
              onChange={(e) => updateAddress({ street: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <FormLabel>City</FormLabel>
              <FormInput
                type="text"
                value={venue.address.city ?? ''}
                onChange={(e) => updateAddress({ city: e.target.value })} />
            </div>
            <div>
              <FormLabel>State</FormLabel>
              <FormInput
                type="text"
                value={venue.address.state ?? ''}
                onChange={(e) => updateAddress({ state: e.target.value })} />
            </div>
            <div>
              <FormLabel>ZIP</FormLabel>
              <FormInput
                type="text"
                value={venue.address.zip ?? ''}
                onChange={(e) => updateAddress({ zip: e.target.value })} />
            </div>
            <div>
              <FormLabel>Country</FormLabel>
              <FormInput
                type="text"
                value={venue.address.country ?? 'US'}
                onChange={(e) => updateAddress({ country: e.target.value })} />
            </div>
          </div>

          {/* Activation Dates */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FormLabel>Activation Start</FormLabel>
              <FormInput
                type="date"
                value={venue.activationDates?.start ?? ''}
                onChange={(e) =>
                  onUpdate({
                    ...venue,
                    activationDates: {
                      start: e.target.value,
                      end: venue.activationDates?.end ?? '',
                    },
                  })
                } />
            </div>
            <div>
              <FormLabel>Activation End</FormLabel>
              <FormInput
                type="date"
                value={venue.activationDates?.end ?? ''}
                onChange={(e) =>
                  onUpdate({
                    ...venue,
                    activationDates: {
                      start: venue.activationDates?.start ?? '',
                      end: e.target.value,
                    },
                  })
                } />
            </div>
          </div>

          {/* Constraint toggles */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={venue.hasLoadIn}
                onChange={(e) =>
                  onUpdate({
                    ...venue,
                    hasLoadIn: e.target.checked,
                    loadIn: e.target.checked
                      ? { date: '', startTime: '', endTime: '' }
                      : null,
                  })
                }
                className="rounded border-border text-org-primary focus:ring-org-primary"
              />
              Load-In Window
            </label>
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={venue.hasStrike}
                onChange={(e) =>
                  onUpdate({
                    ...venue,
                    hasStrike: e.target.checked,
                    strike: e.target.checked
                      ? { date: '', startTime: '', endTime: '' }
                      : null,
                  })
                }
                className="rounded border-border text-org-primary focus:ring-org-primary"
              />
              Strike Window
            </label>
          </div>

          {/* Load-In fields */}
          {venue.hasLoadIn && venue.loadIn && (
            <div className="grid grid-cols-1 gap-4 pl-4 border-l-2 border-border sm:grid-cols-3">
              <div>
                <FormLabel>Load-In Date</FormLabel>
                <FormInput type="date" value={venue.loadIn.date} onChange={(e) => onUpdate({ ...venue, loadIn: { ...venue.loadIn!, date: e.target.value } })} />
              </div>
              <div>
                <FormLabel>Start Time</FormLabel>
                <FormInput type="time" value={venue.loadIn.startTime} onChange={(e) => onUpdate({ ...venue, loadIn: { ...venue.loadIn!, startTime: e.target.value } })} />
              </div>
              <div>
                <FormLabel>End Time</FormLabel>
                <FormInput type="time" value={venue.loadIn.endTime} onChange={(e) => onUpdate({ ...venue, loadIn: { ...venue.loadIn!, endTime: e.target.value } })} />
              </div>
            </div>
          )}

          {/* Strike fields */}
          {venue.hasStrike && venue.strike && (
            <div className="grid grid-cols-1 gap-4 pl-4 border-l-2 border-border sm:grid-cols-3">
              <div>
                <FormLabel>Strike Date</FormLabel>
                <FormInput type="date" value={venue.strike.date} onChange={(e) => onUpdate({ ...venue, strike: { ...venue.strike!, date: e.target.value } })} />
              </div>
              <div>
                <FormLabel>Start Time</FormLabel>
                <FormInput type="time" value={venue.strike.startTime} onChange={(e) => onUpdate({ ...venue, strike: { ...venue.strike!, startTime: e.target.value } })} />
              </div>
              <div>
                <FormLabel>End Time</FormLabel>
                <FormInput type="time" value={venue.strike.endTime} onChange={(e) => onUpdate({ ...venue, strike: { ...venue.strike!, endTime: e.target.value } })} />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <FormLabel>Notes</FormLabel>
            <FormTextarea
              rows={2}
              value={venue.notes}
              onChange={(e) => onUpdate({ ...venue, notes: e.target.value })}
              placeholder="Parking, loading dock info, restrictions..." />
          </div>
        </div>
      )}
    </div>
  );
}
