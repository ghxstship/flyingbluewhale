'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface TimeOffRequest {
  id: string;
  userName: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string | null;
  status: string;
}

interface TimeOffCalendarProps {
  requests?: TimeOffRequest[];
}

export default function TimeOffCalendar({ requests = [] }: TimeOffCalendarProps) {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7; // Monday start
  const daysInMonth = lastDay.getDate();

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  // Helper to get requests overlapping with a given cell date
  const getRequestsForDay = (day: number) => {
    const cellDateObj = new Date(year, month, day);
    // Normalize celldate to beginning of day string YYYY-MM-DD
    const cellDateStr = cellDateObj.toLocaleDateString('en-CA');
    
    return requests.filter(req => {
      if (req.status !== 'approved' && req.status !== 'pending') return false;
      const start = new Date(req.startDate).toLocaleDateString('en-CA');
      const end = new Date(req.endDate).toLocaleDateString('en-CA');
      return cellDateStr >= start && cellDateStr <= end;
    });
  };

  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden overflow-x-auto">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border min-w-[600px]">
        <Button onClick={prevMonth} className="text-sm text-text-secondary hover:text-foreground transition-colors">
          &larr; Prev
        </Button>
        <h2 className="text-base font-semibold text-foreground">
          {MONTH_NAMES[month]} {year}
        </h2>
        <Button onClick={nextMonth} className="text-sm text-text-secondary hover:text-foreground transition-colors">
          Next &rarr;
        </Button>
      </div>

      <div className="grid grid-cols-7 min-w-[600px]">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="px-2 py-2 text-center text-xs font-medium uppercase tracking-wider text-text-muted border-b border-border bg-bg-secondary">
            {day}
          </div>
        ))}
        {cells.map((day, idx) => {
          const dayRequests = day ? getRequestsForDay(day) : [];
          return (
            <div
              key={idx}
              className={`min-h-[100px] px-2 py-1 border-b border-r border-border text-sm flex flex-col ${
                day === null ? 'bg-bg-secondary/50' : 'hover:bg-bg-secondary/10'
              }`}
            >
              {day !== null && (
                <div className="mb-1">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                      isToday(day)
                        ? 'bg-foreground text-background font-medium'
                        : 'text-foreground'
                    }`}
                  >
                    {day}
                  </span>
                </div>
              )}
              {dayRequests.map(req => (
                <div 
                  key={req.id} 
                  className={`text-[10px] truncate px-1 py-0.5 rounded mb-1 font-medium ${
                    req.status === 'approved' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                  }`}
                  title={`${req.userName}: ${req.status}`}
                >
                  {req.userName}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
