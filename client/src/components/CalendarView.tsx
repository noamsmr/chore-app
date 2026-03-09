import { useState, useCallback, useMemo } from 'react';
import { Calendar } from 'react-big-calendar';
import { format, startOfMonth, endOfMonth, addDays } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { localizer } from '../main.tsx';
import { useApp } from '../App.tsx';
import * as api from '../api/index.ts';
import type { CalendarEvent } from '../types.ts';

function formatDate(d: Date) {
  return format(d, 'yyyy-MM-dd');
}

function getInitialRange() {
  const now = new Date();
  // Cover the full visible month grid (up to 6 weeks)
  const start = addDays(startOfMonth(now), -7);
  const end = addDays(endOfMonth(now), 14);
  return { start: formatDate(start), end: formatDate(end) };
}

const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function EventComponent({ event }: { event: CalendarEvent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, overflow: 'hidden' }}>
      {event.completed && (
        <span style={{ color: '#22c55e', fontWeight: 700, flexShrink: 0 }}>✓</span>
      )}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
        {event.title}
      </span>
      {event.member && (
        <span
          style={{
            width: 7, height: 7, borderRadius: '50%',
            background: event.member.color, flexShrink: 0,
          }}
          title={event.member.name}
        />
      )}
    </div>
  );
}

export default function CalendarView() {
  const { selectedMemberIds, selectedCategoryIds, openCreate, setPopoverEvent } = useApp();
  const [range, setRange] = useState(getInitialRange);

  const { data: rawEvents = [] } = useQuery({
    queryKey: ['events', range.start, range.end],
    queryFn: () => api.getEvents(range.start, range.end),
    staleTime: 30_000,
  });

  const handleRangeChange = useCallback((r: Date[] | { start: Date; end: Date }) => {
    if (Array.isArray(r)) {
      setRange({ start: formatDate(r[0]), end: formatDate(r[r.length - 1]) });
    } else {
      setRange({ start: formatDate(r.start), end: formatDate(r.end) });
    }
  }, []);

  const events = useMemo(() => {
    return rawEvents.filter(e => {
      if (selectedMemberIds.size > 0 && (!e.member || !selectedMemberIds.has(e.member.id))) return false;
      if (selectedCategoryIds.size > 0 && (!e.category || !selectedCategoryIds.has(e.category.id))) return false;
      return true;
    });
  }, [rawEvents, selectedMemberIds, selectedCategoryIds]);

  const eventPropGetter = useCallback((event: CalendarEvent) => ({
    style: {
      backgroundColor: event.category?.color ?? '#6366f1',
      border: event.completed ? '2px solid #22c55e' : 'none',
      opacity: event.completed ? 0.75 : 1,
      borderRadius: 4,
    },
  }), []);

  const handleSelectEvent = useCallback((event: CalendarEvent, e: React.SyntheticEvent) => {
    const rect = (e.target as HTMLElement).closest('.rbc-event')?.getBoundingClientRect();
    setPopoverEvent({ ...event, _rect: rect } as CalendarEvent & { _rect?: DOMRect });
  }, [setPopoverEvent]);

  const handleSelectSlot = useCallback(({ start }: { start: Date }) => {
    openCreate(formatDate(start));
  }, [openCreate]);

  return (
    <div style={{ height: '100%', padding: 16 }}>
      <Calendar
        localizer={localizer}
        events={events}
        defaultView="month"
        views={['month', 'week', 'day', 'agenda']}
        onRangeChange={handleRangeChange}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        selectable
        eventPropGetter={eventPropGetter}
        components={{ event: EventComponent as never }}
        popup
        style={{ height: '100%' }}
        dayPropGetter={(date) => {
          const today = new Date();
          const isToday =
            date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate();
          return isToday ? { style: { backgroundColor: '#f0f9ff' } } : {};
        }}
      />
    </div>
  );
}
