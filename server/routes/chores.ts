import { Router } from 'express';
import db from '../db.ts';
import type { RecurrenceType } from '../types.ts';

const router = Router();

const CHORE_SELECT = `
  SELECT
    c.*,
    cat.id   AS cat_id, cat.name AS cat_name, cat.color AS cat_color,
    m.id     AS mem_id, m.name   AS mem_name,  m.color  AS mem_color
  FROM chores c
  LEFT JOIN categories cat ON c.category_id = cat.id
  LEFT JOIN members m      ON c.member_id   = m.id
`;

function shapeRow(row: Record<string, unknown>) {
  if (!row) return null;
  const { cat_id, cat_name, cat_color, mem_id, mem_name, mem_color, ...rest } = row;
  return {
    ...rest,
    category: cat_id != null ? { id: cat_id, name: cat_name, color: cat_color } : null,
    member:   mem_id != null ? { id: mem_id, name: mem_name,  color: mem_color  } : null,
  };
}

router.get('/', (_req, res) => {
  const rows = db.prepare(CHORE_SELECT + ' ORDER BY c.start_date').all() as Record<string, unknown>[];
  res.json(rows.map(shapeRow));
});

router.get('/:id', (req, res) => {
  const row = db.prepare(CHORE_SELECT + ' WHERE c.id = ?').get(req.params.id) as Record<string, unknown> | undefined;
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json(shapeRow(row));
});

router.post('/', (req, res) => {
  const {
    title, description = null,
    category_id = null, member_id = null,
    recurrence_type, start_date, end_date = null,
    recurrence_meta = null, interval_days = null,
  } = req.body as {
    title: string; description?: string;
    category_id?: number; member_id?: number;
    recurrence_type: RecurrenceType; start_date: string; end_date?: string;
    recurrence_meta?: number; interval_days?: number;
  };

  if (!title?.trim()) return res.status(400).json({ error: 'title is required' });
  if (!start_date)    return res.status(400).json({ error: 'start_date is required' });

  const result = db.prepare(`
    INSERT INTO chores (title, description, category_id, member_id, recurrence_type, start_date, end_date, recurrence_meta, interval_days)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title.trim(), description, category_id, member_id, recurrence_type, start_date, end_date, recurrence_meta, interval_days);

  const row = db.prepare(CHORE_SELECT + ' WHERE c.id = ?').get(result.lastInsertRowid) as Record<string, unknown>;
  res.status(201).json(shapeRow(row));
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM chores WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!existing) return res.status(404).json({ error: 'not found' });

  const merged = { ...existing, ...req.body, updated_at: new Date().toISOString() };
  db.prepare(`
    UPDATE chores SET
      title = ?, description = ?, category_id = ?, member_id = ?,
      recurrence_type = ?, start_date = ?, end_date = ?,
      recurrence_meta = ?, interval_days = ?, updated_at = ?
    WHERE id = ?
  `).run(
    merged.title, merged.description, merged.category_id, merged.member_id,
    merged.recurrence_type, merged.start_date, merged.end_date,
    merged.recurrence_meta, merged.interval_days, merged.updated_at,
    id
  );

  const row = db.prepare(CHORE_SELECT + ' WHERE c.id = ?').get(id) as Record<string, unknown>;
  res.json(shapeRow(row));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM chores WHERE id = ?').run(req.params.id);
  res.json({ deleted: true });
});

export default router;
