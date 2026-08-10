export type Category = 'grammar' | 'reading' | 'listening' | 'speaking' | 'spelling' | 'collocations' | 'writing';

export interface Task {
  id: string;
  type: Category;
  description: string;
  completed: boolean;
}

export interface DailyLog {
  id: string;
  date: string;
  tasks: Task[];
  studyMinutes: number;
  notes: string;
}

export interface Problem {
  id: string;
  category: Category;
  title: string;
  description: string;
  example: string;
  dateAdded: string;
  solved: boolean;
  topics: string[];
}

export interface Collocation {
  id: string;
  phrase: string;
  meaning: string;
  usage: string;
  context: 'speaking' | 'writing' | 'both';
  dateAdded: string;
  mastered: boolean;
  topics: string[];
}

export interface StudySession {
  id: string;
  date: string;
  durationMinutes: number;
  category: Category;
  notes: string;
}

export interface Essay {
  id: string;
  topic: string;
  question: string;
  userEssay: string;
  highBandEssay: string;
  lowBandEssay: string;
  vocabulary: string[];
  topics: string[];
  dateAdded: string;
}

export interface AppData {
  dailyLogs: DailyLog[];
  problems: Problem[];
  collocations: Collocation[];
  studySessions: StudySession[];
  essays: Essay[];
}

export const CATEGORY_LABELS: Record<Category, string> = {
  grammar: 'Grammar',
  reading: 'Reading',
  listening: 'Listening',
  speaking: 'Speaking',
  spelling: 'Spelling',
  collocations: 'Collocations',
  writing: 'Writing',
};

export const CATEGORY_COLORS: Record<Category, string> = {
  grammar: '#3b82f6',
  reading: '#10b981',
  listening: '#f59e0b',
  speaking: '#ef4444',
  spelling: '#8b5cf6',
  collocations: '#ec4899',
  writing: '#06b6d4',
};
