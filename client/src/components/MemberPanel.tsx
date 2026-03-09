import { useQuery } from '@tanstack/react-query';
import { useApp } from '../App.tsx';
import * as api from '../api/index.ts';

export default function MemberPanel() {
  const { selectedMemberIds, toggleMember, openMemberModal } = useApp();
  const { data: members = [] } = useQuery({ queryKey: ['members'], queryFn: api.getMembers });

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-header">
        <div className="sidebar-section-title">Team Members</div>
        <button className="sidebar-manage-btn" onClick={() => openMemberModal()}>Manage</button>
      </div>
      {members.map(m => (
        <div
          key={m.id}
          className={`member-item${selectedMemberIds.size > 0 && !selectedMemberIds.has(m.id) ? ' filtered' : ''}`}
          onClick={() => toggleMember(m.id)}
        >
          <span className="color-dot" style={{ background: m.color }} />
          <span style={{ flex: 1, fontSize: 13 }}>{m.name}</span>
          {selectedMemberIds.has(m.id) && (
            <span style={{ fontSize: 11, color: 'var(--primary)' }}>✓</span>
          )}
        </div>
      ))}
      {members.length === 0 && (
        <div style={{ fontSize: 12, color: 'var(--text-faint)', padding: '4px 0' }}>
          No members. <button className="sidebar-manage-btn" style={{ padding: 0 }} onClick={() => openMemberModal()}>Add one</button>
        </div>
      )}
    </div>
  );
}
