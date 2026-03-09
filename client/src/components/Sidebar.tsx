import { useApp } from '../App.tsx';
import MemberPanel from './MemberPanel.tsx';
import CategoryPanel from './CategoryPanel.tsx';

export default function Sidebar() {
  const { openCreate } = useApp();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>🧹 Office Chores</h1>
      </div>
      <div className="sidebar-section">
        <button
          className="btn btn-primary"
          style={{ width: '100%', padding: '10px' }}
          onClick={() => openCreate()}
        >
          + New Chore
        </button>
      </div>
      <MemberPanel />
      <CategoryPanel />
      <div className="sidebar-section" style={{ marginTop: 'auto', fontSize: 11, color: '#94a3b8' }}>
        Click a member or category to filter the calendar.
      </div>
    </aside>
  );
}
