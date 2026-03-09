import { Router } from 'express';
import db from '../db.ts';

const router = Router();

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM members ORDER BY name').all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const { name, color = '#6366f1' } = req.body as { name: string; color?: string };
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });
  const result = db.prepare('INSERT INTO members (name, color) VALUES (?, ?)').run(name.trim(), color);
  const row = db.prepare('SELECT * FROM members WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, color } = req.body as { name?: string; color?: string };
  const existing = db.prepare('SELECT * FROM members WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  db.prepare('UPDATE members SET name = ?, color = ? WHERE id = ?').run(
    name ?? (existing as { name: string }).name,
    color ?? (existing as { color: string }).color,
    id
  );
  const row = db.prepare('SELECT * FROM members WHERE id = ?').get(id);
  res.json(row);
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM members WHERE id = ?').run(id);
  res.json({ deleted: true });
});

export default router;
