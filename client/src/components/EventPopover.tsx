import { useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApp } from '../App.tsx';
import * as api from '../api/index.ts';
import type { CalendarEvent } from '../types.ts';

export default function EventPopover() {
  const { popoverEvent, setPopoverEvent, openEdit } = useApp();
  const qc = useQueryClient();
  const ref = useRef<HTMLDivElement>(null);
  const event = popoverEvent as (CalendarEvent & { _rect?: DOMRect }) | null;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setPopoverEvent(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [setPopoverEvent]);

  const toggleMut = useMutation({
    mutationFn: (ev: CalendarEvent) =>
      ev.completed && ev.completion_id != null
        ? api.deleteCompletion(ev.completion_id)
        : api.createCompletion({ chore_id: ev.chore_id, date: ev.date }),
    onMutate: async (ev) => {
      const keys = qc.getQueriesData<CalendarEvent[]>({ queryKey: ['events'] });
      const snapshots: [unknown[], CalendarEvent[]][] = [];
      for (const [key, data] of keys) {
        if (!data) continue;
        snapshots.push([key as unknown[], data]);
        qc.setQueryData<CalendarEvent[]>(key as unknown[], old =>
          old?.map(e => e.id === ev.id
            ? { ...e, completed: !e.completed, completion_id: e.completed ? null : -1 }
            : e
          )
        );
      }
      setPopoverEvent(prev => prev && prev.id === ev.id
        ? { ...prev, completed: !prev.completed, completion_id: prev.completed ? null : -1 } as CalendarEvent
        : prev
      );
      return { snapshots };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.snapshots) {
        for (const [key, data] of ctx.snapshots) {
          qc.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
    },
  });

  if (!event) return null;

  // Position popover near the event element
  const rect = event._rect;
  const style: React.CSSProperties = { top: 80, left: 300 };
  if (rect) {
    style.top = Math.min(rect.bottom + 8, window.innerHeight - 260);
    style.left = Math.min(rect.left, window.innerWidth - 296);
  }

  return (
    <div className="popover" ref={ref} style={style}>
      <button
        onClick={() => setPopoverEvent(null)}
        style={{ position: 'absolute', top: 8, right: 8, fontSize: 16, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}
      >✕</button>
      <h3>{event.title}</h3>
      <div className="popover-meta">
        <span>📅 {event.date}</span>
        {event.member && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="color-dot" style={{ background: event.member.color }} />
            {event.member.name}
          </span>
        )}
        {event.category && (
          <span className="badge" style={{ background: event.category.color, width: 'fit-content' }}>
            {event.category.name}
          </span>
        )}
      </div>
      <div className="popover-actions">
        <button
          className={`btn ${event.completed ? 'btn-ghost' : 'btn-primary'}`}
          style={{ flex: 1 }}
          onClick={() => toggleMut.mutate(event)}
          disabled={toggleMut.isPending}
        >
          {event.completed ? '↩ Unmark Done' : '✓ Mark Done'}
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => openEdit(event.chore_id)}
        >
          Edit
        </button>
      </div>
    </div>
  );
}
