'use client';

import { useState, useEffect } from 'react';

type RRuleFreq = 'DAILY' | 'WEEKLY' | 'MONTHLY';

interface RRuleBuilderProps {
  value: string | null;
  onChange: (rrule: string | null) => void;
}

export function RRuleBuilder({ value, onChange }: RRuleBuilderProps) {
  const [enabled, setEnabled] = useState(!!value);
  const [freq, setFreq] = useState<RRuleFreq>('WEEKLY');
  const [interval, setInterval] = useState<number>(1);
  const [byDay, setByDay] = useState<string[]>([]);
  const [until, setUntil] = useState<string>('');

  useEffect(() => {
    if (!value) {
      setEnabled(false);
      return;
    }
    setEnabled(true);
    // Rough parse of e.g. FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,WE
    const parts = value.split(';');
    parts.forEach(p => {
      const [k, v] = p.split('=');
      if (k === 'FREQ') setFreq(v as RRuleFreq);
      if (k === 'INTERVAL') setInterval(parseInt(v, 10));
      if (k === 'BYDAY') setByDay(v.split(','));
      if (k === 'UNTIL') setUntil(v); // Note: ICS requires YYYYMMDDTHHMMSSZ format
    });
  }, [value]);

  const updateRule = (newState: any) => {
    if (!enabled && !newState.enabled) {
      onChange(null);
      return;
    }
    
    const f = newState.freq || freq;
    const i = newState.interval || interval;
    const bd = newState.byDay || byDay;
    const u = newState.until !== undefined ? newState.until : until;
    
    let parts = [`FREQ=${f}`];
    if (i > 1) parts.push(`INTERVAL=${i}`);
    if (f === 'WEEKLY' && bd.length > 0) parts.push(`BYDAY=${bd.join(',')}`);
    if (u) {
      // Basic formatting to ICS UTC (assuming u is a date string YYYY-MM-DD)
      const d = new Date(u);
      if (!isNaN(d.getTime())) {
         const utcstr = d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
         parts.push(`UNTIL=${utcstr}`);
      }
    }
    
    onChange(parts.join(';'));
  };

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isEn = e.target.checked;
    setEnabled(isEn);
    if (!isEn) onChange(null);
    else updateRule({ enabled: true });
  };

  const toggleDay = (day: string) => {
    const newBd = byDay.includes(day) ? byDay.filter(d => d !== day) : [...byDay, day];
    setByDay(newBd);
    updateRule({ enabled: true, byDay: newBd });
  };

  return (
    <div className="card p-4 flex flex-col gap-4 border- border-border-subtle bg-surface-raised mb-4">
      <label className="flex items-center gap-3 cursor-pointer">
        <input 
          type="checkbox" 
          checked={enabled} 
          onChange={handleToggle}
          className="w-4 h-4 rounded border-border-subtle text-cyan focus:ring-cyan"
        />
        <span className="text-sm font-heading select-none">Repeat Event</span>
      </label>

      {enabled && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border-subtle">
          <div>
            <label className="block text-xs text-text-secondary mb-1">Frequency</label>
            <select 
              className="input w-full bg-surface"
              value={freq} 
              onChange={e => {
                setFreq(e.target.value as RRuleFreq);
                updateRule({ enabled: true, freq: e.target.value });
              }}
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-1">Interval</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-tertiary">Every</span>
              <input 
                type="number" 
                min={1} 
                max={30}
                className="input w-20 text-center bg-surface"
                value={interval}
                onChange={e => {
                   const v = parseInt(e.target.value, 10) || 1;
                   setInterval(v);
                   updateRule({ enabled: true, interval: v });
                }}
              />
              <span className="text-sm text-text-tertiary">
                {freq === 'DAILY' ? 'Days' : freq === 'WEEKLY' ? 'Weeks' : 'Months'}
              </span>
            </div>
          </div>

          {freq === 'WEEKLY' && (
            <div className="md:col-span-2">
              <label className="block text-xs text-text-secondary mb-2">On Days</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'MO', label: 'Mon' },
                  { id: 'TU', label: 'Tue' },
                  { id: 'WE', label: 'Wed' },
                  { id: 'TH', label: 'Thu' },
                  { id: 'FR', label: 'Fri' },
                  { id: 'SA', label: 'Sat' },
                  { id: 'SU', label: 'Sun' },
                ].map(d => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDay(d.id)}
                    className={`px-3 py-1 text-xs font-mono rounded-full border transition-colors ${
                      byDay.includes(d.id) 
                        ? 'bg-cyan/10 border-cyan text-cyan' 
                        : 'bg-surface border-border-subtle text-text-secondary hover:border-cyan/50'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="md:col-span-2">
            <label className="block text-xs text-text-secondary mb-1">Ends On (Optional)</label>
            <input 
              type="date" 
              className="input bg-surface"
              value={until ? until.split('T')[0] : ''} // basic UI mapping for date selection
              onChange={(e) => {
                const u = e.target.value;
                setUntil(u);
                updateRule({ enabled: true, until: u });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
