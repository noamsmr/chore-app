import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApp } from '../App.tsx';
import * as api from '../api/index.ts';
import type { RecurrenceType } from '../types.ts';
import { format } from 'date-fns';

const TODAY = format(new Date(), 'yyyy-MM-dd');

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
// Bitmask values: Sun=1, Mon=2, Tue=4, Wed=8, Thu=16, Fri=32, Sat=64
const DAY_BITS = [1, 2, 4, 8, 16, 32, 64];

interface FormState {
  title: string;
  description: string;
  category_id: string;
  member_id: string;
  recurrence_type: RecurrenceType;
  start_date: string;
  end_date: string;
  recurrence_meta: number; // bitmask for weekly, day-of-month for monthly
  interval_days: number;
}

const DEFAULTS: FormState = {
  title: '', description: '',
  category_id: '', member_id: '',
  recurrence_type: 'once',
  start_date: TODAY, end_date: '',
  recurrence_meta: 2, // Monday bit
  interval_days: 7,
};

export default function ChoreModal() {
  const { modalState, closeModal, openEdit } = useApp();
  const qc = useQueryClient();

  const isEdit = modalState.type === 'edit';
  const choreId = isEdit ? (modalState as { type: 'edit'; choreId: number }).choreId : null;
  const prefillDate = modalState.type === 'create' ? modalState.prefillDate : undefined;

  const { data: members = [] } = useQuery({ queryKey: ['members'], queryFn: api.getMembers });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: api.getCategories });
  const { data: existingChore } = useQuery({
    queryKey: ['chore', choreId],
    queryFn: () => api.getChore(choreId!),
    enabled: !!choreId,
  });
  const { data: recentCompletions = [] } = useQuery({
    queryKey: ['completions', choreId],
    queryFn: () => api.getCompletions({ chore_id: choreId! }),
    enabled: !!choreId,
  });

  const [form, setForm] = useState<FormState>({
    ...DEFAULTS,
    start_date: prefillDate ?? TODAY,
  });

  useEffect(() => {
    if (existingChore) {
      setForm({
        title: existingChore.title,
        description: existingChore.description ?? '',
        category_id: existingChore.category_id != null ? String(existingChore.category_id) : '',
        member_id: existingChore.member_id != null ? String(existingChore.member_id) : '',
        recurrence_type: existingChore.recurrence_type,
        start_date: existingChore.start_date,
        end_date: existingChore.end_date ?? '',
        recurrence_meta: existingChore.recurrence_meta ?? 2,
        interval_days: existingChore.interval_days ?? 7,
      });
    }
  }, [existingChore]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['events'] });
    qc.invalidateQueries({ queryKey: ['chores'] });
  };

  const createMut = useMutation({ mutationFn: api.createChore, onSuccess: () => { invalidate(); closeModal(); } });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof api.updateChore>[1] }) => api.updateChore(id, data),
    onSuccess: () => { invalidate(); closeModal(); },
  });
  const deleteMut = useMutation({
    mutationFn: api.deleteChore,
    onSuccess: () => { invalidate(); closeModal(); },
  });

  const field = <K extends keyof FormState>(key: K) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value })),
  });

  const toggleDayBit = (bit: number) => {
    setForm(f => ({ ...f, recurrence_meta: f.recurrence_meta ^ bit }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      category_id: form.category_id ? Number(form.category_id) : null,
      member_id: form.member_id ? Number(form.member_id) : null,
      recurrence_type: form.recurrence_type,
      start_date: form.start_date,
      end_date: form.end_date || null,
      recurrence_meta: ['weekly','monthly'].includes(form.recurrence_type) ? form.recurrence_meta : null,
      interval_days: form.recurrence_type === 'custom' ? form.interval_days : null,
    };
    if (isEdit && choreId) {
      updateMut.mutate({ id: choreId, data: payload });
    } else {
      createMut.mutate(payload as Parameters<typeof api.createChore>[0]);
    }
  };

  const isBusy = createMut.isPending || updateMut.isPending;

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && closeModal()}>
      <div className="modal">
        <h2>{isEdit ? 'Edit Chore' : 'New Chore'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input autoFocus placeholder="e.g. Take out trash" required {...field('title')} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows={2} placeholder="Optional details…" style={{ resize: 'vertical' }} {...field('description')} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Assigned To</label>
              <select {...field('member_id')}>
                <option value="">— Unassigned —</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Category</label>
              <select {...field('category_id')}>
                <option value="">— None —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Recurrence</label>
            <select {...field('recurrence_type')}>
              <option value="once">One-time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom interval</option>
            </select>
          </div>

          {form.recurrence_type === 'weekly' && (
            <div className="form-group">
              <label>Days of week</label>
              <div className="day-checkboxes">
                {DAYS.map((day, i) => (
                  <label key={day} className="day-checkbox">
                    <span>{day}</span>
                    <input
                      type="checkbox"
                      checked={!!(form.recurrence_meta & DAY_BITS[i])}
                      onChange={() => toggleDayBit(DAY_BITS[i])}
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {form.recurrence_type === 'monthly' && (
            <div className="form-group">
              <label>Day of month</label>
              <input
                type="number" min={1} max={31}
                value={form.recurrence_meta}
                onChange={e => setForm(f => ({ ...f, recurrence_meta: Number(e.target.value) }))}
              />
            </div>
          )}

          {form.recurrence_type === 'custom' && (
            <div className="form-group">
              <label>Repeat every (days)</label>
              <input
                type="number" min={1}
                value={form.interval_days}
                onChange={e => setForm(f => ({ ...f, interval_days: Number(e.target.value) }))}
              />
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>{form.recurrence_type === 'once' ? 'Date *' : 'Start Date *'}</label>
              <input type="date" required {...field('start_date')} />
            </div>
            {form.recurrence_type !== 'once' && (
              <div className="form-group">
                <label>End Date (optional)</label>
                <input type="date" {...field('end_date')} />
              </div>
            )}
          </div>

          <div className="modal-actions">
            {isEdit && (
              <button
                type="button"
                className="btn btn-danger"
                style={{ marginRight: 'auto' }}
                onClick={() => { if (confirm('Delete this chore?')) deleteMut.mutate(choreId!); }}
              >
                Delete
              </button>
            )}
            <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isBusy}>
              {isBusy ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Chore'}
            </button>
          </div>
        </form>

        {isEdit && recentCompletions.length > 0 && (
          <div className="completions-list">
            <h4>Recent Completions</h4>
            {recentCompletions.slice(0, 10).map(c => (
              <div key={c.id} className="completion-row">
                <span>{c.date}</span>
                <span style={{ color: '#22c55e' }}>✓ Done</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
