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
    meaning TEXT DEFAULT '',
    usage TEXT DEFAULT '',
    context TEXT DEFAULT 'both',
    date_added TEXT NOT NULL,
    mastered INTEGER DEFAULT 0,
    topics TEXT DEFAULT '[]'
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
    vocabulary TEXT DEFAULT '[]',
    topics TEXT DEFAULT '[]',
    date_added TEXT NOT NULL
  );
`);

export default db;
