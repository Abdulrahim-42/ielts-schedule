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
  definition: string;
  writingTask1Example: string;
  writingTask2Example: string;
  speakingExample: string;
  context: 'speaking' | 'writing' | 'both';
  dateAdded: string;
  mastered: boolean;
  topics: string[];
  level: number;
  lastReviewed: string;
  nextReview: string;
  reviewCount: number;
  note: string;
  source: 'seed' | 'custom';
  synonyms: string[];
  antonyms: string[];
}

export interface StudySession {
  id: string;
  date: string;
  durationMinutes: number;
  category: Category;
  notes: string;
  testName: string;
}

export interface Essay {
  id: string;
  topic: string;
  question: string;
  userEssay: string;
  highBandEssay: string;
  lowBandEssay: string;
  topics: string[];
  dateAdded: string;
}

export interface WritingMistake {
  id: string;
  mistakeText: string;
  correctText: string;
  category: 'grammar' | 'spelling' | 'vocabulary' | 'task_response';
  taskType: 'task1' | 'task2' | 'both';
  count: number;
  firstSeen: string;
  lastSeen: string;
  essayIds: string[];
  solved: boolean;
}

export interface AppData {
  dailyLogs: DailyLog[];
  problems: Problem[];
  collocations: Collocation[];
  studySessions: StudySession[];
  essays: Essay[];
  writingMistakes: WritingMistake[];
}

export interface Topic {
  id: string;
  name: string;
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

export type { QuestionType, Task1Essay } from './task1';
export { QUESTION_TYPE_LABELS } from './task1';
