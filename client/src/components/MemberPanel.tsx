import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApp } from '../App.tsx';
import * as api from '../api/index.ts';
import type { Member } from '../types.ts';

const COLORS = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ef4444','#06b6d4'];

export default function MemberPanel() {
  const { selectedMemberIds, toggleMember } = useApp();
  const qc = useQueryClient();
  const { data: members = [] } = useQuery({ queryKey: ['members'], queryFn: api.getMembers });
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const invalidate = () => { qc.invalidateQueries({ queryKey: ['members'] }); };

  const createMut = useMutation({ mutationFn: api.createMember, onSuccess: () => { setNewName(''); invalidate(); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }: { id: number; data: Partial<Member> }) => api.updateMember(id, data), onSuccess: () => { setEditingId(null); invalidate(); } });
  const deleteMut = useMutation({ mutationFn: api.deleteMember, onSuccess: () => { invalidate(); qc.invalidateQueries({ queryKey: ['events'] }); } });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) createMut.mutate({ name: newName.trim(), color: newColor });
  };

  const startEdit = (m: Member) => { setEditingId(m.id); setEditName(m.name); };

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-title">Team Members</div>
      {members.map(m => (
        editingId === m.id ? (
          <form key={m.id} className="add-form" onSubmit={e => { e.preventDefault(); updateMut.mutate({ id: m.id, data: { name: editName } }); }}>
            <input autoFocus value={editName} onChange={e => setEditName(e.target.value)} />
            <button type="submit">✓</button>
            <button type="button" onClick={() => setEditingId(null)} style={{ background: '#f1f5f9', color: '#475569' }}>✕</button>
          </form>
        ) : (
          <div
            key={m.id}
            className={`member-item ${selectedMemberIds.size > 0 && !selectedMemberIds.has(m.id) ? 'filtered' : ''}`}
            onClick={() => toggleMember(m.id)}
          >
            <span className="color-dot" style={{ background: m.color }} />
            <span style={{ flex: 1, fontSize: 13 }}>{m.name}</span>
            <div className="item-actions" onClick={e => e.stopPropagation()}>
              <button className="icon-btn" onClick={() => startEdit(m)}>✎</button>
              <button className="icon-btn" onClick={() => deleteMut.mutate(m.id)} style={{ color: '#ef4444' }}>✕</button>
            </div>
          </div>
        )
      ))}
      <form className="add-form" onSubmit={handleAdd}>
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="Add member…"
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
