import type { AppData, DailyLog, Problem, Collocation, StudySession, Essay } from '../types';

const API = '';

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// ─── Load all data ───
export async function loadDataAsync(): Promise<AppData> {
  const [dailyLogs, problems, collocations, studySessions, essays] = await Promise.all([
    api<DailyLog[]>('/api/daily-logs'),
    api<Problem[]>('/api/problems'),
    api<Collocation[]>('/api/collocations'),
    api<StudySession[]>('/api/study-sessions'),
    api<Essay[]>('/api/essays'),
  ]);
  return { dailyLogs, problems, collocations, studySessions, essays };
}

// ─── Daily Log ───
export async function saveDailyLogAsync(log: DailyLog): Promise<void> {
  await api('/api/daily-logs/' + log.date, {
    method: 'PUT',
    body: JSON.stringify({
      id: log.id,
      tasks: log.tasks,
      studyMinutes: log.studyMinutes,
      notes: log.notes,
    }),
  });
}

export async function deleteDailyLogAsync(date: string): Promise<void> {
  await api('/api/daily-logs/' + date, { method: 'DELETE' });
}

// ─── Problems ───
export async function addProblemAsync(problem: Problem): Promise<void> {
  await api('/api/problems', { method: 'POST', body: JSON.stringify(problem) });
}

export async function updateProblemAsync(problem: Problem): Promise<void> {
  await api('/api/problems/' + problem.id, { method: 'PUT', body: JSON.stringify(problem) });
}

export async function deleteProblemAsync(id: string): Promise<void> {
  await api('/api/problems/' + id, { method: 'DELETE' });
}

// ─── Collocations ───
export async function addCollocationAsync(col: Collocation): Promise<void> {
  await api('/api/collocations', { method: 'POST', body: JSON.stringify(col) });
}

export async function updateCollocationAsync(col: Collocation): Promise<void> {
  await api('/api/collocations/' + col.id, { method: 'PUT', body: JSON.stringify(col) });
}

export async function deleteCollocationAsync(id: string): Promise<void> {
  await api('/api/collocations/' + id, { method: 'DELETE' });
}

// ─── Study Sessions ───
export async function addStudySessionAsync(session: StudySession): Promise<void> {
  await api('/api/study-sessions', { method: 'POST', body: JSON.stringify(session) });
}

// ─── Essays ───
export async function addEssayAsync(essay: Essay): Promise<void> {
  await api('/api/essays', { method: 'POST', body: JSON.stringify(essay) });
}

export async function updateEssayAsync(essay: Essay): Promise<void> {
  await api('/api/essays/' + essay.id, { method: 'PUT', body: JSON.stringify(essay) });
}

export async function deleteEssayAsync(id: string): Promise<void> {
  await api('/api/essays/' + id, { method: 'DELETE' });
}

// ─── Timer (uses localStorage - fast, synchronous, always available) ───
const TIMER_KEY = 'ielts-timer-state';

export interface TimerState {
  isRunning: boolean;
  startTimestamp: number;
  accumulatedSeconds: number;
}

export function loadTimer(): TimerState {
  try {
    const raw = localStorage.getItem(TIMER_KEY);
    if (!raw) return { isRunning: false, startTimestamp: 0, accumulatedSeconds: 0 };
    const state: TimerState = JSON.parse(raw);
    if (state.isRunning) {
      const elapsed = Math.floor((Date.now() - state.startTimestamp) / 1000);
      state.accumulatedSeconds += elapsed;
      state.startTimestamp = Date.now();
      localStorage.setItem(TIMER_KEY, JSON.stringify(state));
    }
    return state;
  } catch {
    return { isRunning: false, startTimestamp: 0, accumulatedSeconds: 0 };
  }
}

export function saveTimer(state: TimerState): void {
  localStorage.setItem(TIMER_KEY, JSON.stringify(state));
}

export function clearTimer(): void {
  localStorage.removeItem(TIMER_KEY);
}
