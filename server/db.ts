import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'ielts-tracker.db');

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS daily_logs (
    id TEXT PRIMARY KEY,
    date TEXT UNIQUE NOT NULL,
    study_minutes INTEGER DEFAULT 0,
    notes TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    daily_log_id TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    FOREIGN KEY (daily_log_id) REFERENCES daily_logs(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS problems (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    example TEXT DEFAULT '',
    date_added TEXT NOT NULL,
    solved INTEGER DEFAULT 0,
    topics TEXT DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS collocations (
    id TEXT PRIMARY KEY,
    phrase TEXT NOT NULL,
    definition TEXT DEFAULT '',
    writing_task1_example TEXT DEFAULT '',
    writing_task2_example TEXT DEFAULT '',
    speaking_example TEXT DEFAULT '',
    context TEXT DEFAULT 'both',
    date_added TEXT NOT NULL,
    mastered INTEGER DEFAULT 0,
    topics TEXT DEFAULT '[]',
    level INTEGER DEFAULT 0,
    last_reviewed TEXT DEFAULT '',
    next_review TEXT DEFAULT '',
    review_count INTEGER DEFAULT 0,
    note TEXT DEFAULT '',
    source TEXT DEFAULT 'seed'
  );

  CREATE TABLE IF NOT EXISTS study_sessions (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    category TEXT NOT NULL,
    notes TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS timer_state (
    id TEXT PRIMARY KEY DEFAULT 'current',
    is_running INTEGER DEFAULT 0,
    start_timestamp INTEGER DEFAULT 0,
    accumulated_seconds INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS essays (
    id TEXT PRIMARY KEY,
    topic TEXT NOT NULL,
    question TEXT DEFAULT '',
    user_essay TEXT DEFAULT '',
    high_band_essay TEXT DEFAULT '',
    low_band_essay TEXT DEFAULT '',
    topics TEXT DEFAULT '[]',
    date_added TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS task1_essays (
    id TEXT PRIMARY KEY,
    question_type TEXT NOT NULL,
    image_filename TEXT DEFAULT '',
    image_upload_base64 TEXT DEFAULT '',
    task_prompt TEXT DEFAULT '',
    transcription TEXT DEFAULT '',
    date_added TEXT NOT NULL,
    word_count INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS topics (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
  );
`);

// Add missing columns to existing tables (safe to run multiple times)
const addColumnIfMissing = (table: string, column: string, type: string, defaultVal: string) => {
  try {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${type} DEFAULT ${defaultVal}`).run();
  } catch {
    // Column already exists, ignore
  }
};

addColumnIfMissing('collocations', 'level', 'INTEGER', '0');
addColumnIfMissing('collocations', 'last_reviewed', "TEXT", "''");
addColumnIfMissing('collocations', 'next_review', "TEXT", "''");
addColumnIfMissing('collocations', 'review_count', 'INTEGER', '0');
addColumnIfMissing('collocations', 'definition', "TEXT", "''");
addColumnIfMissing('collocations', 'writing_task1_example', "TEXT", "''");
addColumnIfMissing('collocations', 'writing_task2_example', "TEXT", "''");
addColumnIfMissing('collocations', 'speaking_example', "TEXT", "''");
addColumnIfMissing('collocations', 'note', "TEXT", "''");
addColumnIfMissing('collocations', 'source', "TEXT", "'seed'");
addColumnIfMissing('collocations', 'synonyms', "TEXT", "'[]'");
addColumnIfMissing('collocations', 'antonyms', "TEXT", "'[]'");
addColumnIfMissing('task1_essays', 'task_prompt', "TEXT", "''");
addColumnIfMissing('essays', 'collocation_ids', "TEXT", "'[]'");
addColumnIfMissing('study_sessions', 'test_name', "TEXT", "''");

// Writing mistakes table
db.exec(`
  CREATE TABLE IF NOT EXISTS writing_mistakes (
    id TEXT PRIMARY KEY,
    mistake_text TEXT NOT NULL,
    correct_text TEXT NOT NULL,
    category TEXT NOT NULL,
    task_type TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    first_seen TEXT NOT NULL,
    last_seen TEXT NOT NULL,
    essay_ids TEXT DEFAULT '[]',
    solved INTEGER DEFAULT 0
  );
`);

// Remove obsolete columns from existing collocations tables (SQLite 3.35+)
const dropColumnIfPresent = (table: string, column: string) => {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (cols.some((c) => c.name === column)) {
    db.prepare(`ALTER TABLE ${table} DROP COLUMN ${column}`).run();
  }
};
dropColumnIfPresent('collocations', 'meaning');
dropColumnIfPresent('collocations', 'usage');

// Seed 42 IELTS topic categories (only if empty or below 42)
const topicCount = db.prepare('SELECT COUNT(*) as count FROM topics').get() as any;
if (topicCount.count === 0) {
  db.prepare('DELETE FROM topics').run();
  const insert = db.prepare('INSERT INTO topics (id, name) VALUES (?, ?)');
  const seedTopics = [
    'work, education & ambition',
    'environment, technology & modern life',
    'society, culture & relationships',
    'health, leisure & abstract concepts',
    'media, news & entertainment',
    'economics, consumerism & modern values',
    'art, architecture & cultural heritage',
    'science, research & space',
    'government, law & international relations',
    'psychology & human behavior',
    'history, archeology & the past',
    'wildlife, nature & animals',
    'philosophy, ethics & values',
    'globalization & international tourism',
    'the digital age & social media',
    'sports, competition & fitness',
    'architecture & urban planning',
    'weather & natural disasters',
    'advertising & marketing',
    'transport & infrastructure',
    'science & discovery',
    'family & generations',
    'globalization, culture & identity',
    'success, ambition & motivation',
    'the media, news & information',
    'ethics, morality & crime',
    'the arts, literature & creativity',
    'psychology & human behavior',
    'architecture & urban planning',
    'weather, climate & natural disasters',
    'sport, fitness & competition',
    'law, crime & punishment',
    'astronomy, space & exploration',
    'language, literacy & communication',
    'philosophy, ethics & values',
    'the economy, business & money',
    'agriculture, food & farming',
    'crime, law & punishment',
    'media & information',
    'transport & infrastructure',
    'sport & competition',
    'family & generations',
  ];
  for (const name of seedTopics) {
    insert.run(crypto.randomUUID(), name);
  }
}

export default db;
