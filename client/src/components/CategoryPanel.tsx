import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApp } from '../App.tsx';
import * as api from '../api/index.ts';
import type { Category } from '../types.ts';

export default function CategoryPanel() {
  const { selectedCategoryIds, toggleCategory } = useApp();
  const qc = useQueryClient();
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: api.getCategories });
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#10b981');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const invalidate = () => { qc.invalidateQueries({ queryKey: ['categories'] }); };

  const createMut = useMutation({ mutationFn: api.createCategory, onSuccess: () => { setNewName(''); invalidate(); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }: { id: number; data: Partial<Category> }) => api.updateCategory(id, data), onSuccess: () => { setEditingId(null); invalidate(); } });
  const deleteMut = useMutation({ mutationFn: api.deleteCategory, onSuccess: () => { invalidate(); qc.invalidateQueries({ queryKey: ['events'] }); } });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) createMut.mutate({ name: newName.trim(), color: newColor });
  };

  const startEdit = (c: Category) => { setEditingId(c.id); setEditName(c.name); };

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-title">Categories</div>
      {categories.map(c => (
        editingId === c.id ? (
          <form key={c.id} className="add-form" onSubmit={e => { e.preventDefault(); updateMut.mutate({ id: c.id, data: { name: editName } }); }}>
            <input autoFocus value={editName} onChange={e => setEditName(e.target.value)} />
            <button type="submit">✓</button>
            <button type="button" onClick={() => setEditingId(null)} style={{ background: '#f1f5f9', color: '#475569' }}>✕</button>
          </form>
        ) : (
          <div
            key={c.id}
            className={`category-item ${selectedCategoryIds.size > 0 && !selectedCategoryIds.has(c.id) ? 'filtered' : ''}`}
            onClick={() => toggleCategory(c.id)}
          >
            <span className="color-dot" style={{ background: c.color }} />
            <span style={{ flex: 1, fontSize: 13 }}>{c.name}</span>
            <div className="item-actions" onClick={e => e.stopPropagation()}>
              <button className="icon-btn" onClick={() => startEdit(c)}>✎</button>
              <button className="icon-btn" onClick={() => deleteMut.mutate(c.id)} style={{ color: '#ef4444' }}>✕</button>
            </div>
          </div>
        )
      ))}
      <form className="add-form" onSubmit={handleAdd}>
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="Add category…"
        />
        <input
          type="color"
          value={newColor}
          onChange={e => setNewColor(e.target.value)}
          style={{ width: 32, padding: 2, border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}
          title="Pick color"
        />
        <button type="submit" disabled={!newName.trim()}>+</button>
      </form>
    </div>
  );
}
