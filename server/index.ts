import express from 'express';
import cors from 'cors';
import db from './db.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// --- Daily Logs ---
app.get('/api/daily-logs', (req, res) => {
  const logs = db.prepare('SELECT * FROM daily_logs').all();
  const tasks = db.prepare('SELECT * FROM tasks').all() as any[];
  const result = logs.map((log: any) => ({
    ...log,
    studyMinutes: log.study_minutes,
    tasks: tasks
      .filter((t) => t.daily_log_id === log.id)
      .map((t) => ({ ...t, completed: !!t.completed })),
  }));
  res.json(result);
});

app.get('/api/daily-logs/:date', (req, res) => {
  const log = db.prepare('SELECT * FROM daily_logs WHERE date = ?').get(req.params.date) as any;
  if (!log) return res.json(null);
  const tasks = db.prepare('SELECT * FROM tasks WHERE daily_log_id = ?').all(log.id) as any[];
  res.json({
    ...log,
    studyMinutes: log.study_minutes,
    tasks: tasks.map((t) => ({ ...t, completed: !!t.completed })),
  });
});

app.put('/api/daily-logs/:date', (req, res) => {
  const { id, tasks, studyMinutes, notes } = req.body;
  const existing = db.prepare('SELECT * FROM daily_logs WHERE date = ?').get(req.params.date) as any;

  if (existing) {
    db.prepare('UPDATE daily_logs SET study_minutes = ?, notes = ? WHERE date = ?').run(
      studyMinutes ?? existing.study_minutes,
      notes ?? existing.notes,
      req.params.date
    );
    if (tasks) {
      db.prepare('DELETE FROM tasks WHERE daily_log_id = ?').run(existing.id);
      const insert = db.prepare('INSERT INTO tasks (id, daily_log_id, type, description, completed) VALUES (?, ?, ?, ?, ?)');
      for (const t of tasks) {
        insert.run(t.id, existing.id, t.type, t.description, t.completed ? 1 : 0);
      }
    }
  } else {
    const logId = id || crypto.randomUUID();
    db.prepare('INSERT INTO daily_logs (id, date, study_minutes, notes) VALUES (?, ?, ?, ?)').run(
      logId, req.params.date, studyMinutes ?? 0, notes ?? ''
    );
    if (tasks) {
      const insert = db.prepare('INSERT INTO tasks (id, daily_log_id, type, description, completed) VALUES (?, ?, ?, ?, ?)');
      for (const t of tasks) {
        insert.run(t.id, logId, t.type, t.description, t.completed ? 1 : 0);
      }
    }
  }
  res.json({ ok: true });
});

app.delete('/api/daily-logs/:date', (req, res) => {
  const log = db.prepare('SELECT * FROM daily_logs WHERE date = ?').get(req.params.date) as any;
  if (log) {
    db.prepare('DELETE FROM tasks WHERE daily_log_id = ?').run(log.id);
    db.prepare('DELETE FROM daily_logs WHERE id = ?').run(log.id);
  }
  res.json({ ok: true });
});

// --- Problems ---
app.get('/api/problems', (_req, res) => {
  const problems = db.prepare('SELECT * FROM problems ORDER BY date_added DESC').all() as any[];
  res.json(problems.map((p) => ({
    ...p,
    dateAdded: p.date_added,
    solved: !!p.solved,
    topics: JSON.parse(p.topics || '[]'),
  })));
});

app.post('/api/problems', (req, res) => {
  const { id, category, title, description, example, dateAdded, solved, topics } = req.body;
  db.prepare('INSERT INTO problems (id, category, title, description, example, date_added, solved, topics) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    id, category, title, description || '', example || '', dateAdded, solved ? 1 : 0, JSON.stringify(topics || [])
  );
  res.json({ ok: true });
});

app.put('/api/problems/:id', (req, res) => {
  const { category, title, description, example, solved, topics } = req.body;
  db.prepare('UPDATE problems SET category = ?, title = ?, description = ?, example = ?, solved = ?, topics = ? WHERE id = ?').run(
    category, title, description || '', example || '', solved ? 1 : 0, JSON.stringify(topics || []), req.params.id
  );
  res.json({ ok: true });
});

app.delete('/api/problems/:id', (req, res) => {
  db.prepare('DELETE FROM problems WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// --- Collocations ---
app.get('/api/collocations', (_req, res) => {
  const cols = db.prepare('SELECT * FROM collocations ORDER BY date_added DESC').all() as any[];
  res.json(cols.map((c) => ({
    ...c,
    dateAdded: c.date_added,
    mastered: !!c.mastered,
    topics: JSON.parse(c.topics || '[]'),
  })));
});

app.post('/api/collocations', (req, res) => {
  const { id, phrase, meaning, usage, context, dateAdded, mastered, topics } = req.body;
  db.prepare('INSERT INTO collocations (id, phrase, meaning, usage, context, date_added, mastered, topics) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    id, phrase, meaning || '', usage || '', context || 'both', dateAdded, mastered ? 1 : 0, JSON.stringify(topics || [])
  );
  res.json({ ok: true });
});

app.put('/api/collocations/:id', (req, res) => {
  const { phrase, meaning, usage, context, mastered, topics } = req.body;
  db.prepare('UPDATE collocations SET phrase = ?, meaning = ?, usage = ?, context = ?, mastered = ?, topics = ? WHERE id = ?').run(
    phrase, meaning || '', usage || '', context || 'both', mastered ? 1 : 0, JSON.stringify(topics || []), req.params.id
  );
  res.json({ ok: true });
});

app.delete('/api/collocations/:id', (req, res) => {
  db.prepare('DELETE FROM collocations WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// --- Study Sessions ---
app.get('/api/study-sessions', (_req, res) => {
  const sessions = db.prepare('SELECT * FROM study_sessions ORDER BY date DESC').all() as any[];
  res.json(sessions.map((s) => ({
    ...s,
    durationMinutes: s.duration_minutes,
  })));
});

app.post('/api/study-sessions', (req, res) => {
  const { id, date, durationMinutes, category, notes } = req.body;
  db.prepare('INSERT INTO study_sessions (id, date, duration_minutes, category, notes) VALUES (?, ?, ?, ?, ?)').run(
    id, date, durationMinutes, category, notes || ''
  );
  res.json({ ok: true });
});

// --- Timer State ---
app.get('/api/timer', (_req, res) => {
  let row = db.prepare('SELECT * FROM timer_state WHERE id = ?').get('current') as any;
  if (!row) {
    db.prepare('INSERT INTO timer_state (id, is_running, start_timestamp, accumulated_seconds) VALUES (?, 0, 0, 0)').run('current');
    row = db.prepare('SELECT * FROM timer_state WHERE id = ?').get('current') as any;
  }
  res.json({
    isRunning: !!row.is_running,
    startTimestamp: row.start_timestamp,
    accumulatedSeconds: row.accumulated_seconds,
  });
});

app.put('/api/timer', (req, res) => {
  const { isRunning, startTimestamp, accumulatedSeconds } = req.body;
  db.prepare('UPDATE timer_state SET is_running = ?, start_timestamp = ?, accumulated_seconds = ? WHERE id = ?').run(
    isRunning ? 1 : 0, startTimestamp, accumulatedSeconds, 'current'
  );
  res.json({ ok: true });
});

app.delete('/api/timer', (_req, res) => {
  db.prepare('UPDATE timer_state SET is_running = 0, start_timestamp = 0, accumulated_seconds = 0 WHERE id = ?').run('current');
  res.json({ ok: true });
});

// --- Essays ---
app.get('/api/essays', (_req, res) => {
  const essays = db.prepare('SELECT * FROM essays ORDER BY date_added DESC').all() as any[];
  res.json(essays.map((e) => ({
    id: e.id,
    topic: e.topic,
    question: e.question,
    userEssay: e.user_essay,
    highBandEssay: e.high_band_essay,
    lowBandEssay: e.low_band_essay,
    vocabulary: JSON.parse(e.vocabulary || '[]'),
    topics: JSON.parse(e.topics || '[]'),
    dateAdded: e.date_added,
  })));
});

app.post('/api/essays', (req, res) => {
  const { id, topic, question, userEssay, highBandEssay, lowBandEssay, vocabulary, topics, dateAdded } = req.body;
  db.prepare('INSERT INTO essays (id, topic, question, user_essay, high_band_essay, low_band_essay, vocabulary, topics, date_added) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    id, topic, question || '', userEssay || '', highBandEssay || '', lowBandEssay || '', JSON.stringify(vocabulary || []), JSON.stringify(topics || []), dateAdded
  );
  res.json({ ok: true });
});

app.put('/api/essays/:id', (req, res) => {
  const { topic, question, userEssay, highBandEssay, lowBandEssay, vocabulary, topics } = req.body;
  db.prepare('UPDATE essays SET topic = ?, question = ?, user_essay = ?, high_band_essay = ?, low_band_essay = ?, vocabulary = ?, topics = ? WHERE id = ?').run(
    topic, question || '', userEssay || '', highBandEssay || '', lowBandEssay || '', JSON.stringify(vocabulary || []), JSON.stringify(topics || []), req.params.id
  );
  res.json({ ok: true });
});

app.delete('/api/essays/:id', (req, res) => {
  db.prepare('DELETE FROM essays WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
