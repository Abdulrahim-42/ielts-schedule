import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { v4 as uuid } from 'uuid';
import { loadDataAsync, saveDailyLogAsync, addStudySessionAsync } from '../utils/localStorage';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../types';
import type { Category, Task, DailyLog, AppData } from '../types';
import Timer from '../components/Timer';

const allCategories: Category[] = ['grammar', 'reading', 'listening', 'speaking', 'spelling', 'collocations', 'writing'];
const today = () => new Date().toISOString().split('T')[0];
const EMPTY: AppData = { dailyLogs: [], problems: [], collocations: [], studySessions: [], essays: [] };

export default function DailyLog() {
  const [data, setData] = useState<AppData>(EMPTY);
  const [selectedDate, setSelectedDate] = useState(today());
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskType, setNewTaskType] = useState<Category>('grammar');
  const [notes, setNotes] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const reload = () => loadDataAsync().then(setData);

  useEffect(() => { reload(); }, []);

  const log = useMemo(() => data.dailyLogs.find((l) => l.date === selectedDate), [data, selectedDate]);
  const tasks = log?.tasks ?? [];

  const groupedTasks = useMemo(() => {
    const groups: Record<Category, Task[]> = {} as Record<Category, Task[]>;
    for (const cat of allCategories) groups[cat] = [];
    for (const task of tasks) groups[task.type].push(task);
    return groups;
  }, [tasks]);

  const visibleCategories = useMemo(
    () => allCategories.filter((cat) => groupedTasks[cat].length > 0),
    [groupedTasks]
  );

  useEffect(() => {
    const currentLog = data.dailyLogs.find((l) => l.date === selectedDate);
    setNotes(currentLog?.notes ?? '');
  }, [selectedDate, data]);

  const persistLog = async (updater: (log: DailyLog) => DailyLog) => {
    const existing = data.dailyLogs.find((l) => l.date === selectedDate);
    const base: DailyLog = existing ?? { id: uuid(), date: selectedDate, tasks: [], studyMinutes: 0, notes: '' };
    const updated = updater(base);
    await saveDailyLogAsync(updated);
    await reload();
  };

  const saveRef = useRef(false);
  const saveNotes = async (value: string) => {
    if (saveRef.current) return;
    saveRef.current = true;
    setSaveStatus('saving');
    try {
      await persistLog((log) => ({ ...log, notes: value }));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
    } finally {
      saveRef.current = false;
    }
  };

  const handleAddTask = async () => {
    if (!newTaskDesc.trim()) return;
    const newTask: Task = { id: uuid(), type: newTaskType, description: newTaskDesc.trim(), completed: false };
    await persistLog((log) => ({ ...log, tasks: [...log.tasks, newTask] }));
    setNewTaskDesc('');
  };

  const toggleTask = async (taskId: string) => {
    await persistLog((log) => ({
      ...log,
      tasks: log.tasks.map((t) => t.id === taskId ? { ...t, completed: !t.completed } : t),
    }));
  };

  const deleteTask = async (taskId: string) => {
    await persistLog((log) => ({ ...log, tasks: log.tasks.filter((t) => t.id !== taskId) }));
  };

  const handleSessionComplete = useCallback(
    async (minutes: number) => {
      await addStudySessionAsync({ id: uuid(), date: selectedDate, durationMinutes: minutes, category: 'grammar', notes: '' });
      await persistLog((log) => ({ ...log, studyMinutes: log.studyMinutes + minutes }));
    },
    [selectedDate, data]
  );

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Daily Log</h1>
          <p className="text-gray-500 mt-1">Track your tasks and study time</p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <Timer onSessionComplete={handleSessionComplete} />

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Tasks ({completedCount}/{tasks.length} completed)
          </h2>
        </div>

        <div className="flex gap-2 mb-4">
          <select
            value={newTaskType}
            onChange={(e) => setNewTaskType(e.target.value as Category)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <input
            type="text"
            value={newTaskDesc}
            onChange={(e) => setNewTaskDesc(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
            placeholder="Add a new task..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleAddTask}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Add
          </button>
        </div>

        {tasks.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No tasks yet. Add one above!</p>
        ) : (
          <div className="space-y-5">
            {visibleCategories.map((cat) => (
              <div key={cat}>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: CATEGORY_COLORS[cat] }}>
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
                  {CATEGORY_LABELS[cat]}
                  <span className="text-xs font-normal text-gray-400">
                    ({groupedTasks[cat].filter((t) => t.completed).length}/{groupedTasks[cat].length})
                  </span>
                </h3>
                <div className="space-y-2 ml-5 border-l-2 pl-4" style={{ borderColor: `${CATEGORY_COLORS[cat]}30` }}>
                  {groupedTasks[cat].map((task) => (
                    <div key={task.id} className={`flex items-center gap-3 p-3 rounded-lg border ${task.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                      <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                      <span className={`flex-1 text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>{task.description}</span>
                      <button onClick={() => deleteTask(task.id)} className="text-gray-400 hover:text-red-500 transition-colors text-lg">&times;</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Notes</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={(e) => saveNotes(e.target.value)}
          placeholder="Write about what you studied, problems encountered, etc. (auto-saves)"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-gray-400">
            Auto-saves when you click away from the text area
            {saveStatus === 'saving' && <span className="ml-2 text-blue-500">Saving...</span>}
            {saveStatus === 'saved' && <span className="ml-2 text-green-500">Saved!</span>}
            {saveStatus === 'error' && <span className="ml-2 text-red-500">Save failed</span>}
          </p>
          <button onClick={() => saveNotes(notes)} disabled={saveStatus === 'saving'} className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors disabled:opacity-50">
            Save Notes
          </button>
        </div>
      </div>
    </div>
  );
}
