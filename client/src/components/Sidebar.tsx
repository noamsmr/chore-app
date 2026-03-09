import { useApp } from '../App.tsx';
import MemberPanel from './MemberPanel.tsx';
import CategoryPanel from './CategoryPanel.tsx';

export default function Sidebar() {
  const { openCreate, dark, setDark, sidebarOpen, setSidebarOpen } = useApp();

  return (
    <>
      {/* Mobile hamburger */}
      <button className="hamburger" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
        ☰
      </button>

      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-header">
          <h1>🧹 Office Chores</h1>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              className="dark-toggle"
              onClick={() => setDark(!dark)}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? '☀️' : '🌙'}
            </button>
            <button
              className="sidebar-close"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="sidebar-section">
          <button
            className="btn btn-primary btn-full"
            onClick={() => { openCreate(); setSidebarOpen(false); }}
          >
            + New Chore
          </button>
        </div>

        <MemberPanel />
        <CategoryPanel />

        <div className="sidebar-footer">
          Click a member or category to filter the calendar.
        </div>
      </aside>
    </>
  );
}
