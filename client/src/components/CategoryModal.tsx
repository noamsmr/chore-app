import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApp } from '../App.tsx';
import * as api from '../api/index.ts';

const COLORS = ['#10b981','#6366f1','#ec4899','#f59e0b','#3b82f6','#8b5cf6','#ef4444','#06b6d4','#f97316','#84cc16'];

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="color-swatches">
      {COLORS.map(c => (
        <button
          key={c}
          type="button"
          className={`color-swatch${value === c ? ' selected' : ''}`}
          style={{ background: c }}
          onClick={() => onChange(c)}
          title={c}
        />
      ))}
    </div>
  );
}

type View = { kind: 'list' } | { kind: 'create' } | { kind: 'edit'; id: number; name: string; color: string };

export default function CategoryModal() {
  const { closeCategoryModal } = useApp();
  const qc = useQueryClient();
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: api.getCategories });

  const [view, setView] = useState<View>({ kind: 'list' });
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState(COLORS[0]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['categories'] });
    qc.invalidateQueries({ queryKey: ['events'] });
  };

  const createMut = useMutation({
    mutationFn: api.createCategory,
    onSuccess: () => { invalidate(); setView({ kind: 'list' }); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; color: string } }) => api.updateCategory(id, data),
    onSuccess: () => { invalidate(); setView({ kind: 'list' }); },
  });

  const deleteMut = useMutation({
    mutationFn: api.deleteCategory,
    onSuccess: () => invalidate(),
  });

  const startCreate = () => {
    setFormName('');
    setFormColor(COLORS[0]);
    setView({ kind: 'create' });
  };

  const startEdit = (id: number, name: string, color: string) => {
    setFormName(name);
    setFormColor(color);
    setView({ kind: 'edit', id, name, color });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    if (view.kind === 'create') {
      createMut.mutate({ name: formName.trim(), color: formColor });
    } else if (view.kind === 'edit') {
      updateMut.mutate({ id: view.id, data: { name: formName.trim(), color: formColor } });
    }
  };

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && closeCategoryModal()}>
      <div className="modal modal-sm">
        {view.kind === 'list' ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ marginBottom: 0 }}>Categories</h2>
              <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 13 }} onClick={startCreate}>
                + Add
              </button>
            </div>
            <div className="manage-list">
              {categories.length === 0 && (
                <div style={{ color: 'var(--text-faint)', fontSize: 13, padding: '4px 0' }}>No categories yet.</div>
              )}
              {categories.map(c => (
                <div key={c.id} className="manage-item">
                  <span className="color-dot" style={{ background: c.color, width: 12, height: 12 }} />
                  <span className="manage-item-name">{c.name}</span>
                  <div className="manage-item-actions">
                    <button className="icon-btn" title="Edit" onClick={() => startEdit(c.id, c.name, c.color)}>✎</button>
                    <button
                      className="icon-btn danger"
                      title="Delete"
                      onClick={() => { if (confirm(`Delete "${c.name}"?`)) deleteMut.mutate(c.id); }}
                    >✕</button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn btn-ghost" onClick={closeCategoryModal}>Close</button>
            </div>
          </>
        ) : (
          <>
            <h2>{view.kind === 'create' ? 'Add Category' : 'Edit Category'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input
                  autoFocus
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Category name…"
                  required
                />
              </div>
              <div className="form-group">
                <label>Color</label>
                <ColorPicker value={formColor} onChange={setFormColor} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setView({ kind: 'list' })}>Back</button>
                <button type="submit" className="btn btn-primary" disabled={isPending || !formName.trim()}>
                  {isPending ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
