import type { Member, Category, Chore, CalendarEvent, Completion, RecurrenceType } from '../types.ts';

const BASE = '/api';

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function json(body: unknown): RequestInit {
  return { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

// Members
export const getMembers = () => req<Member[]>(`${BASE}/members`);
export const createMember = (data: { name: string; color?: string }) =>
  req<Member>(`${BASE}/members`, { method: 'POST', ...json(data) });
export const updateMember = (id: number, data: Partial<{ name: string; color: string }>) =>
  req<Member>(`${BASE}/members/${id}`, { method: 'PUT', ...json(data) });
export const deleteMember = (id: number) =>
  req<{ deleted: boolean }>(`${BASE}/members/${id}`, { method: 'DELETE' });

// Categories
export const getCategories = () => req<Category[]>(`${BASE}/categories`);
export const createCategory = (data: { name: string; color?: string }) =>
  req<Category>(`${BASE}/categories`, { method: 'POST', ...json(data) });
export const updateCategory = (id: number, data: Partial<{ name: string; color: string }>) =>
  req<Category>(`${BASE}/categories/${id}`, { method: 'PUT', ...json(data) });
export const deleteCategory = (id: number) =>
  req<{ deleted: boolean }>(`${BASE}/categories/${id}`, { method: 'DELETE' });

// Chores
export const getChores = () => req<Chore[]>(`${BASE}/chores`);
export const getChore = (id: number) => req<Chore>(`${BASE}/chores/${id}`);
export const createChore = (data: {
  title: string; description?: string;
  category_id?: number | null; member_id?: number | null;
  recurrence_type: RecurrenceType; start_date: string; end_date?: string | null;
  recurrence_meta?: number | null; interval_days?: number | null;
}) => req<Chore>(`${BASE}/chores`, { method: 'POST', ...json(data) });
export const updateChore = (id: number, data: Partial<Chore>) =>
  req<Chore>(`${BASE}/chores/${id}`, { method: 'PUT', ...json(data) });
export const deleteChore = (id: number) =>
  req<{ deleted: boolean }>(`${BASE}/chores/${id}`, { method: 'DELETE' });

// Events
export const getEvents = async (start: string, end: string): Promise<CalendarEvent[]> => {
  const raw = await req<Array<Omit<CalendarEvent, 'start' | 'end' | 'allDay'> & { start: string; end: string }>>(
    `${BASE}/events?start=${start}&end=${end}`
  );
  return raw.map(e => ({
    ...e,
    start: new Date(e.start),
    end: new Date(e.end),
    allDay: true as const,
  }));
};

// Completions
export const getCompletions = (params: { start?: string; end?: string; chore_id?: number }) => {
  const q = new URLSearchParams();
  if (params.start)    q.set('start', params.start);
  if (params.end)      q.set('end', params.end);
  if (params.chore_id) q.set('chore_id', String(params.chore_id));
  return req<Completion[]>(`${BASE}/completions?${q}`);
};
export const createCompletion = (data: { chore_id: number; date: string; member_id?: number; note?: string }) =>
  req<Completion>(`${BASE}/completions`, { method: 'POST', ...json(data) });
export const deleteCompletion = (id: number) =>
  req<{ deleted: boolean }>(`${BASE}/completions/${id}`, { method: 'DELETE' });
