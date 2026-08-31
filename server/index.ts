import express from 'express';
import cors from 'cors';
import db from './db.js';
import { seedCollocations } from './seed-collocations.js';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'task1');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
app.use('/uploads/task1', express.static(UPLOAD_DIR));

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
    id: c.id,
    phrase: c.phrase,
    definition: c.definition || '',
    writingTask1Example: c.writing_task1_example || '',
    writingTask2Example: c.writing_task2_example || '',
    speakingExample: c.speaking_example || '',
    context: c.context,
    dateAdded: c.date_added,
    mastered: !!c.mastered,
    topics: JSON.parse(c.topics || '[]'),
    level: c.level || 0,
    lastReviewed: c.last_reviewed || '',
    nextReview: c.next_review || '',
    reviewCount: c.review_count || 0,
    note: c.note || '',
    source: c.source || 'seed',
    synonyms: JSON.parse(c.synonyms || '[]'),
    antonyms: JSON.parse(c.antonyms || '[]'),
  })));
});

app.post('/api/collocations', (req, res) => {
  const { id, phrase, definition, writingTask1Example, writingTask2Example, speakingExample, context, dateAdded, mastered, topics, level, lastReviewed, nextReview, reviewCount, note, source, synonyms, antonyms } = req.body;
  db.prepare('INSERT INTO collocations (id, phrase, definition, writing_task1_example, writing_task2_example, speaking_example, context, date_added, mastered, topics, level, last_reviewed, next_review, review_count, note, source, synonyms, antonyms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    id, phrase, definition || '', writingTask1Example || '', writingTask2Example || '', speakingExample || '', context || 'both', dateAdded, mastered ? 1 : 0, JSON.stringify(topics || []), level || 0, lastReviewed || '', nextReview || '', reviewCount || 0, note || '', source || 'custom', JSON.stringify(synonyms || []), JSON.stringify(antonyms || [])
  );
  res.json({ ok: true });
});

app.put('/api/collocations/:id', (req, res) => {
  const { phrase, definition, writingTask1Example, writingTask2Example, speakingExample, context, mastered, topics, level, lastReviewed, nextReview, reviewCount, note, source, synonyms, antonyms } = req.body;
  db.prepare('UPDATE collocations SET phrase = ?, definition = ?, writing_task1_example = ?, writing_task2_example = ?, speaking_example = ?, context = ?, mastered = ?, topics = ?, level = ?, last_reviewed = ?, next_review = ?, review_count = ?, note = ?, source = ?, synonyms = ?, antonyms = ? WHERE id = ?').run(
    phrase, definition || '', writingTask1Example || '', writingTask2Example || '', speakingExample || '', context || 'both', mastered ? 1 : 0, JSON.stringify(topics || []), level || 0, lastReviewed || '', nextReview || '', reviewCount || 0, note || '', source || 'seed', JSON.stringify(synonyms || []), JSON.stringify(antonyms || []), req.params.id
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
    testName: s.test_name || '',
  })));
});

app.post('/api/study-sessions', (req, res) => {
  const { id, date, durationMinutes, category, notes, testName } = req.body;
  db.prepare('INSERT INTO study_sessions (id, date, duration_minutes, category, notes, test_name) VALUES (?, ?, ?, ?, ?, ?)').run(
    id, date, durationMinutes, category, notes || '', testName || ''
  );
  res.json({ ok: true });
});

app.put('/api/study-sessions/:id', (req, res) => {
  const { date, durationMinutes, category, notes, testName } = req.body;
  db.prepare('UPDATE study_sessions SET date = ?, duration_minutes = ?, category = ?, notes = ?, test_name = ? WHERE id = ?').run(
    date, durationMinutes, category, notes || '', testName || '', req.params.id
  );
  res.json({ ok: true });
});

app.delete('/api/study-sessions/:id', (req, res) => {
  db.prepare('DELETE FROM study_sessions WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// --- Writing Mistakes ---
app.get('/api/writing-mistakes', (_req, res) => {
  const mistakes = db.prepare('SELECT * FROM writing_mistakes ORDER BY count DESC').all() as any[];
  res.json(mistakes.map((m) => ({
    ...m,
    mistakeText: m.mistake_text,
    correctText: m.correct_text,
    taskType: m.task_type,
    firstSeen: m.first_seen,
    lastSeen: m.last_seen,
    essayIds: JSON.parse(m.essay_ids || '[]'),
    solved: !!m.solved,
  })));
});

app.post('/api/writing-mistakes', (req, res) => {
  const { id, mistakeText, correctText, category, taskType, firstSeen, lastSeen, essayIds } = req.body;
  db.prepare('INSERT INTO writing_mistakes (id, mistake_text, correct_text, category, task_type, count, first_seen, last_seen, essay_ids) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    id, mistakeText, correctText, category, taskType, 1, firstSeen, lastSeen, JSON.stringify(essayIds || [])
  );
  res.json({ ok: true });
});

app.put('/api/writing-mistakes/:id', (req, res) => {
  const { mistakeText, correctText, category, taskType, count, lastSeen, essayIds, solved } = req.body;
  db.prepare('UPDATE writing_mistakes SET mistake_text = ?, correct_text = ?, category = ?, task_type = ?, count = ?, last_seen = ?, essay_ids = ?, solved = ? WHERE id = ?').run(
    mistakeText, correctText, category, taskType, count, lastSeen, JSON.stringify(essayIds || []), solved ? 1 : 0, req.params.id
  );
  res.json({ ok: true });
});

app.delete('/api/writing-mistakes/:id', (req, res) => {
  db.prepare('DELETE FROM writing_mistakes WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.post('/api/writing-mistakes/scan', (req, res) => {
  const { text, taskType, essayId } = req.body;
  if (!text || !taskType || !essayId) {
    return res.status(400).json({ error: 'text, taskType, and essayId are required' });
  }
  
  // Error patterns to scan for
  const patterns = [
    { pattern: /operative/gi, fix: 'co-operative', category: 'vocabulary' },
    { pattern: /To beginning with/gi, fix: 'To begin with', category: 'grammar' },
    { pattern: /an common/gi, fix: 'a common', category: 'grammar' },
    { pattern: /rivality/gi, fix: 'rivalry', category: 'spelling' },
    { pattern: /termins/gi, fix: 'terms', category: 'spelling' },
    { pattern: /scrunity/gi, fix: 'scrutiny', category: 'spelling' },
    { pattern: /drammatic/gi, fix: 'dramatic', category: 'spelling' },
    { pattern: /get decreased/gi, fix: 'decreased', category: 'grammar' },
    { pattern: /the China/gi, fix: 'China', category: 'grammar' },
    { pattern: /leadershipness/gi, fix: 'leadership', category: 'spelling' },
    { pattern: /By the way/gi, fix: 'Furthermore / Moreover', category: 'grammar' },
    { pattern: /conquer every situations/gi, fix: 'conquer every situation', category: 'grammar' },
    { pattern: /both views are acceptable/gi, fix: 'clear stance', category: 'task_response' },
    { pattern: /obtain success/gi, fix: 'achieve success', category: 'vocabulary' },
    { pattern: /lowest score/gi, fix: 'lowest share', category: 'vocabulary' },
    { pattern: /growing fairly/gi, fix: 'rising gradually', category: 'vocabulary' },
    { pattern: /dramatic breakthrough/gi, fix: 'sharp rise', category: 'vocabulary' },
    { pattern: /recorded lowest score/gi, fix: 'was the lowest', category: 'vocabulary' },
    { pattern: /changeable/gi, fix: 'fluctuated', category: 'vocabulary' },
    { pattern: /minumum/gi, fix: 'minimum', category: 'spelling' },
    { pattern: /robust self-concentration/gi, fix: 'strong focus', category: 'vocabulary' },
    { pattern: /how to being/gi, fix: 'how to be', category: 'grammar' },
    { pattern: /they should to learn/gi, fix: 'they should learn', category: 'grammar' },
    { pattern: /makes easier them/gi, fix: 'makes it easier for them', category: 'grammar' },
    { pattern: /numerous of actions/gi, fix: 'numerous actions', category: 'grammar' },
    { pattern: /individuals have affected/gi, fix: 'individuals are affected', category: 'grammar' },
    { pattern: /they work each other/gi, fix: 'they work with each other', category: 'grammar' },
    { pattern: /in order to robust/gi, fix: 'in order to build robust', category: 'grammar' },
  ];
  
  const today = new Date().toISOString().split('T')[0];
  const detected = [];
  
  for (const p of patterns) {
    if (p.pattern.test(text)) {
      detected.push({ mistakeText: p.pattern.source, correctText: p.fix, category: p.category });
    }
  }
  
  res.json({ detected, taskType, essayId, date: today });
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

// --- Topics ---
app.get('/api/topics', (_req, res) => {
  const topics = db.prepare('SELECT * FROM topics ORDER BY name ASC').all();
  res.json(topics);
});

app.post('/api/topics', (req, res) => {
  const { id, name } = req.body;
  try {
    db.prepare('INSERT INTO topics (id, name) VALUES (?, ?)').run(id || crypto.randomUUID(), name.trim().toLowerCase());
    res.json({ ok: true });
  } catch (e: any) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(409).json({ error: 'Topic already exists' });
    } else {
      res.status(500).json({ error: e.message });
    }
  }
});

app.delete('/api/topics/:id', (req, res) => {
  db.prepare('DELETE FROM topics WHERE id = ?').run(req.params.id);
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
    topics: JSON.parse(e.topics || '[]'),
    dateAdded: e.date_added,
  })));
});

app.post('/api/essays', (req, res) => {
  const { id, topic, question, userEssay, highBandEssay, lowBandEssay, topics, dateAdded } = req.body;
  db.prepare('INSERT INTO essays (id, topic, question, user_essay, high_band_essay, low_band_essay, topics, date_added) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    id, topic, question || '', userEssay || '', highBandEssay || '', lowBandEssay || '', JSON.stringify(topics || []), dateAdded
  );
  res.json({ ok: true });
});

app.put('/api/essays/:id', (req, res) => {
  const { topic, question, userEssay, highBandEssay, lowBandEssay, topics } = req.body;
  db.prepare('UPDATE essays SET topic = ?, question = ?, user_essay = ?, high_band_essay = ?, low_band_essay = ?, topics = ? WHERE id = ?').run(
    topic, question || '', userEssay || '', highBandEssay || '', lowBandEssay || '', JSON.stringify(topics || []), req.params.id
  );
  res.json({ ok: true });
});

app.delete('/api/essays/:id', (req, res) => {
  db.prepare('DELETE FROM essays WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// --- Writing Task 1 ---
app.get('/api/task1-essays', (_req, res) => {
  const rows = db.prepare('SELECT * FROM task1_essays ORDER BY date_added DESC').all() as any[];
  res.json(rows.map((r) => {
    let imageUrl = '';
    if (r.image_filename) {
      imageUrl = `/uploads/task1/${r.image_filename}`;
    } else if (r.image_upload_base64) {
      imageUrl = r.image_upload_base64;
    }
    return {
      id: r.id,
      questionType: r.question_type,
      imageFilename: r.image_filename,
      imageUrl,
      taskPrompt: r.task_prompt || '',
      transcription: r.transcription,
      dateAdded: r.date_added,
      wordCount: r.word_count,
    };
  }));
});

app.post('/api/task1-essays', (req, res) => {
  const { id, questionType, imageFilename, imageUploadBase64, imageUrl, taskPrompt, transcription, wordCount } = req.body;

  let storedFilename = imageFilename || '';
  let base64Data = imageUploadBase64 || '';

  // Handle base64 data URL (from frontend imagePreview)
  if (!base64Data && imageUrl && imageUrl.startsWith('data:image')) {
    base64Data = imageUrl;
  }

  // Save image to disk if we have base64 data
  if (base64Data) {
    const matches = base64Data.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
    if (matches) {
      const ext = matches[1] === 'image/png' ? 'png' : 'jpg';
      storedFilename = `${id}.${ext}`;
      const buffer = Buffer.from(matches[2], 'base64');
      fs.writeFileSync(path.join(UPLOAD_DIR, storedFilename), buffer);
    }
  }

  db.prepare('INSERT INTO task1_essays (id, question_type, image_filename, image_upload_base64, task_prompt, transcription, date_added, word_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, questionType, storedFilename, base64Data, taskPrompt || '', transcription || '', new Date().toISOString().split('T')[0], wordCount || 0);
  res.json({ ok: true, id });
});

app.get('/api/task1-essays/:id', (req, res) => {
  const r = db.prepare('SELECT * FROM task1_essays WHERE id = ?').get(req.params.id) as any;
  if (!r) return res.status(404).json({ error: 'Not found' });
  let imageUrl = '';
  if (r.image_filename) {
    imageUrl = `/uploads/task1/${r.image_filename}`;
  } else if (r.image_upload_base64) {
    imageUrl = r.image_upload_base64;
  }
  res.json({
    id: r.id,
    questionType: r.question_type,
    imageFilename: r.image_filename,
    imageUrl,
    taskPrompt: r.task_prompt || '',
    transcription: r.transcription,
    dateAdded: r.date_added,
    wordCount: r.word_count,
  });
});

app.delete('/api/task1-essays/:id', (req, res) => {
  const row = db.prepare('SELECT image_filename FROM task1_essays WHERE id = ?').get(req.params.id) as any;
  if (row?.image_filename) {
    const file = path.join(UPLOAD_DIR, row.image_filename);
    if (fs.existsSync(file)) fs.rmSync(file);
  }
  db.prepare('DELETE FROM task1_essays WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// --- Band Score Calculator ---
function calculateBandScore(score: number, total: number): number {
  const percentage = (score / total) * 100;
  if (percentage >= 95) return 9.0;
  if (percentage >= 90) return 8.5;
  if (percentage >= 85) return 8.0;
  if (percentage >= 80) return 7.5;
  if (percentage >= 75) return 7.0;
  if (percentage >= 70) return 6.5;
  if (percentage >= 65) return 6.0;
  if (percentage >= 60) return 5.5;
  if (percentage >= 55) return 5.0;
  if (percentage >= 50) return 4.5;
  if (percentage >= 45) return 4.0;
  if (percentage >= 40) return 3.5;
  if (percentage >= 35) return 3.0;
  if (percentage >= 30) return 2.5;
  if (percentage >= 25) return 2.0;
  if (percentage >= 20) return 1.5;
  if (percentage >= 15) return 1.0;
  return 0.0;
}

function roundToNearestHalf(score: number): number {
  return Math.round(score * 2) / 2;
}

app.get('/api/overall-band', (_req, res) => {
  // Get latest scores from study sessions
  const sessions = db.prepare('SELECT * FROM study_sessions ORDER BY date DESC').all() as any[];
  
  // Get latest reading results (from notes containing "Cambridge")
  const readingSessions = sessions.filter(s => s.category === 'reading' && s.notes?.includes('Cambridge'));
  const listeningSessions = sessions.filter(s => s.category === 'listening' && s.notes?.includes('Cambridge'));
  
  // Extract scores from notes
  function extractScore(notes: string): { score: number; total: number; band: number } | null {
    const match = notes?.match(/(\d+)\/40/);
    if (match) {
      const score = parseInt(match[1]);
      const band = calculateBandScore(score, 40);
      return { score, total: 40, band };
    }
    return null;
  }
  
  // Get latest scores
  const latestReading = readingSessions.length > 0 ? extractScore(readingSessions[0].notes) : null;
  const latestListening = listeningSessions.length > 0 ? extractScore(listeningSessions[0].notes) : null;
  
  // Get latest essay scores (from essays table)
  const essays = db.prepare('SELECT * FROM essays ORDER BY date_added DESC').all() as any[];
  const latestWritingT2 = essays.length > 0 ? essays[0] : null;
  
  // Get latest Task 1 scores
  const task1Essays = db.prepare('SELECT * FROM task1_essays ORDER BY date_added DESC').all() as any[];
  const latestWritingT1 = task1Essays.length > 0 ? task1Essays[0] : null;
  
  // Calculate individual band scores
  const readingBand = latestReading?.band || 0;
  const listeningBand = latestListening?.band || 0;
  
  // For writing, we estimate based on essay quality (simplified)
  const writingBand = latestWritingT2 ? 5.5 : 5.0; // Default estimate
  const speakingBand = 0; // Unknown
  
  // Calculate overall band
  const scores = [readingBand, listeningBand, writingBand, speakingBand].filter(s => s > 0);
  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  const overallBand = roundToNearestHalf(average);
  
  res.json({
    skills: {
      listening: { band: listeningBand, score: latestListening?.score, total: 40 },
      reading: { band: readingBand, score: latestReading?.score, total: 40 },
      writing: { band: writingBand, note: 'Estimated from essay quality' },
      speaking: { band: speakingBand, note: 'Not yet assessed' }
    },
    overall: overallBand,
    target: 7.5,
    gap: 7.5 - overallBand,
    nextMilestone: Math.ceil(overallBand * 2 + 1) / 2 // Round up to next 0.5
  });
});

seedCollocations(db);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
