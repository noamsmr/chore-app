import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'chores.db');

const db = new DatabaseSync(DB_PATH);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS members (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    color      TEXT    NOT NULL DEFAULT '#6366f1',
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL UNIQUE,
    color      TEXT    NOT NULL DEFAULT '#10b981',
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS chores (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    title           TEXT    NOT NULL,
    description     TEXT,
    category_id     INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    member_id       INTEGER REFERENCES members(id) ON DELETE SET NULL,
    recurrence_type TEXT    NOT NULL CHECK(recurrence_type IN ('once','daily','weekly','monthly','custom')),
    start_date      TEXT    NOT NULL,
    end_date        TEXT,
    recurrence_meta INTEGER,
    interval_days   INTEGER,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS completions (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    chore_id     INTEGER NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
    date         TEXT    NOT NULL,
    member_id    INTEGER REFERENCES members(id) ON DELETE SET NULL,
    note         TEXT,
    completed_at TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(chore_id, date)
  );

  CREATE INDEX IF NOT EXISTS idx_chores_start ON chores(start_date);
  CREATE INDEX IF NOT EXISTS idx_chores_end   ON chores(end_date);
  CREATE INDEX IF NOT EXISTS idx_comp_chore   ON completions(chore_id);
  CREATE INDEX IF NOT EXISTS idx_comp_date    ON completions(date);
`);

export default db;
