import { useQuery } from '@tanstack/react-query';
import { useApp } from '../App.tsx';
import * as api from '../api/index.ts';

export default function CategoryPanel() {
  const { selectedCategoryIds, toggleCategory, openCategoryModal } = useApp();
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: api.getCategories });

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-header">
        <div className="sidebar-section-title">Categories</div>
        <button className="sidebar-manage-btn" onClick={() => openCategoryModal()}>Manage</button>
      </div>
      {categories.map(c => (
        <div
          key={c.id}
          className={`category-item${selectedCategoryIds.size > 0 && !selectedCategoryIds.has(c.id) ? ' filtered' : ''}`}
          onClick={() => toggleCategory(c.id)}
        >
          <span className="color-dot" style={{ background: c.color }} />
          <span style={{ flex: 1, fontSize: 13 }}>{c.name}</span>
          {selectedCategoryIds.has(c.id) && (
            <span style={{ fontSize: 11, color: 'var(--primary)' }}>✓</span>
          )}
        </div>
      ))}
      {categories.length === 0 && (
        <div style={{ fontSize: 12, color: 'var(--text-faint)', padding: '4px 0' }}>
          No categories. <button className="sidebar-manage-btn" style={{ padding: 0 }} onClick={() => openCategoryModal()}>Add one</button>
        </div>
      )}
    </div>
  );
}
