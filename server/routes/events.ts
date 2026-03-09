import { Router } from 'express';
import db from '../db.ts';
import type { CalendarEvent, Category, Member } from '../types.ts';

const router = Router();

const MAX_RANGE_DAYS = 92;

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86_400_000);
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function expandOccurrences(chore: Record<string, unknown>, rangeStart: Date, rangeEnd: Date): string[] {
  const choreStart = parseDate(chore.start_date as string);
  const choreEnd = chore.end_date ? parseDate(chore.end_date as string) : null;
  const iterStart = choreStart > rangeStart ? choreStart : rangeStart;
  const iterEnd = choreEnd && choreEnd < rangeEnd ? choreEnd : rangeEnd;

  if (iterStart > iterEnd) return [];

  const dates: string[] = [];

  switch (chore.recurrence_type as string) {
    case 'once': {
      if (choreStart >= rangeStart && choreStart <= rangeEnd) {
        dates.push(formatDate(choreStart));
      }
      break;
    }
    case 'daily': {
      for (let d = iterStart; d <= iterEnd; d = addDays(d, 1)) {
        dates.push(formatDate(d));
      }
      break;
    }
    case 'weekly': {
      const meta = (chore.recurrence_meta as number) || 0;
      // Start from the Sunday of the week containing iterStart
      const dayOfWeek = iterStart.getUTCDay();
      let d = addDays(iterStart, -dayOfWeek);
      while (d <= iterEnd) {
        const bit = 1 << d.getUTCDay();
        if ((meta & bit) && d >= iterStart && d >= choreStart) {
          dates.push(formatDate(d));
        }
        d = addDays(d, 1);
      }
      break;
    }
    case 'monthly': {
      const targetDay = (chore.recurrence_meta as number) || 1;
      let year = iterStart.getUTCFullYear();
      let month = iterStart.getUTCMonth();
      while (true) {
        const daysInMonth = getDaysInMonth(year, month);
        const actualDay = Math.min(targetDay, daysInMonth);
        const candidate = new Date(Date.UTC(year, month, actualDay));
        if (candidate > iterEnd) break;
        if (candidate >= iterStart && candidate >= choreStart) {
          dates.push(formatDate(candidate));
        }
        month++;
        if (month > 11) { month = 0; year++; }
      }
      break;
    }
    case 'custom': {
      const interval = (chore.interval_days as number) || 1;
      const daysSinceStart = daysBetween(choreStart, iterStart);
      const remainder = daysSinceStart % interval;
      const offset = remainder === 0 ? 0 : interval - remainder;
      let d = addDays(iterStart, offset);
      while (d <= iterEnd) {
        dates.push(formatDate(d));
        d = addDays(d, interval);
      }
      break;
    }
  }

  return dates;
}

router.get('/', (req, res) => {
  const { start, end } = req.query as { start?: string; end?: string };
  if (!start || !end) return res.status(400).json({ error: 'start and end are required' });

  const rangeStart = parseDate(start);
  const rangeEnd   = parseDate(end);

  if (isNaN(rangeStart.getTime()) || isNaN(rangeEnd.getTime())) {
    return res.status(400).json({ error: 'invalid date format' });
  }
  if (rangeEnd < rangeStart) return res.status(400).json({ error: 'end must be >= start' });

  const clampedEnd = daysBetween(rangeStart, rangeEnd) > MAX_RANGE_DAYS
    ? addDays(rangeStart, MAX_RANGE_DAYS)
    : rangeEnd;

  // Fetch chores whose active window overlaps the range
  const chores = db.prepare(`
    SELECT c.*,
      cat.id AS cat_id, cat.name AS cat_name, cat.color AS cat_color,
      m.id   AS mem_id, m.name  AS mem_name,  m.color   AS mem_color
    FROM chores c
    LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN members m      ON c.member_id   = m.id
    WHERE c.start_date <= ?
      AND (c.end_date IS NULL OR c.end_date >= ?)
  `).all(formatDate(clampedEnd), formatDate(rangeStart)) as Record<string, unknown>[];

  // Index completions by chore_id -> date
  const completions = db.prepare(
    'SELECT * FROM completions WHERE date >= ? AND date <= ?'
  ).all(formatDate(rangeStart), formatDate(clampedEnd)) as Record<string, unknown>[];

  const compMap = new Map<number, Map<string, Record<string, unknown>>>();
  for (const c of completions) {
    const cid = c.chore_id as number;
    if (!compMap.has(cid)) compMap.set(cid, new Map());
    compMap.get(cid)!.set(c.date as string, c);
  }

  const events: CalendarEvent[] = [];

  for (const chore of chores) {
    const occurrences = expandOccurrences(chore, rangeStart, clampedEnd);
    const choreCompMap = compMap.get(chore.id as number);

    const category: Category | null = chore.cat_id != null
      ? { id: chore.cat_id as number, name: chore.cat_name as string, color: chore.cat_color as string, created_at: '' }
      : null;
    const member: Member | null = chore.mem_id != null
      ? { id: chore.mem_id as number, name: chore.mem_name as string, color: chore.mem_color as string, created_at: '' }
      : null;

    for (const date of occurrences) {
      const comp = choreCompMap?.get(date);
      const time = chore.time as string | null;
      const allDay = !time;
      events.push({
        id: `${chore.id}_${date}`,
        chore_id: chore.id as number,
        title: chore.title as string,
        start: time ? `${date}T${time}:00` : `${date}T00:00:00`,
        end: time ? `${date}T${time}:00` : `${date}T23:59:59`,
        date,
        allDay,
        category,
        member,
        completed: !!comp,
        completion_id: comp ? (comp.id as number) : null,
      });
    }
  }

  events.sort((a, b) => a.date.localeCompare(b.date));
  res.json(events);
});

export default router;
