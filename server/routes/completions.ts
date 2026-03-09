import { Router } from 'express';
import db from '../db.ts';

const router = Router();

router.get('/', (req, res) => {
  const { start, end, chore_id } = req.query as { start?: string; end?: string; chore_id?: string };
  let sql = 'SELECT * FROM completions WHERE 1=1';
  const params: (string | number)[] = [];
  if (start) { sql += ' AND date >= ?'; params.push(start); }
  if (end)   { sql += ' AND date <= ?'; params.push(end); }
  if (chore_id) { sql += ' AND chore_id = ?'; params.push(Number(chore_id)); }
  sql += ' ORDER BY date DESC LIMIT 200';
  res.json(db.prepare(sql).all(...params));
});

router.post('/', (req, res) => {
  const { chore_id, date, member_id = null, note = null } = req.body as {
    chore_id: number; date: string; member_id?: number; note?: string;
  };
  if (!chore_id || !date) return res.status(400).json({ error: 'chore_id and date are required' });
  const result = db.prepare(
    'INSERT OR IGNORE INTO completions (chore_id, date, member_id, note) VALUES (?, ?, ?, ?)'
  ).run(chore_id, date, member_id, note);
  const row = db.prepare('SELECT * FROM completions WHERE chore_id = ? AND date = ?').get(chore_id, date);
  res.status(result.changes > 0 ? 201 : 200).json(row);
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM completions WHERE id = ?').run(req.params.id);
  res.json({ deleted: true });
});

export default router;
