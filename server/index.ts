import express from 'express';
import cors from 'cors';
import './db.ts'; // initialize DB on startup

import membersRouter     from './routes/members.ts';
import categoriesRouter  from './routes/categories.ts';
import choresRouter      from './routes/chores.ts';
import completionsRouter from './routes/completions.ts';
import eventsRouter      from './routes/events.ts';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

app.use(cors());
app.use(express.json());

app.use('/api/members',     membersRouter);
app.use('/api/categories',  categoriesRouter);
app.use('/api/chores',      choresRouter);
app.use('/api/completions', completionsRouter);
app.use('/api/events',      eventsRouter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Chore server running on http://0.0.0.0:${PORT}`);
});
