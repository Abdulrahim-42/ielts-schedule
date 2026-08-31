import { useMemo, useState, useEffect } from 'react';
import { loadDataAsync } from '../utils/localStorage';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../types';
import type { Category, AppData } from '../types';

const EMPTY: AppData = { dailyLogs: [], problems: [], collocations: [], studySessions: [], essays: [], writingMistakes: [] };

export default function Progress() {
  const [data, setData] = useState<AppData>(EMPTY);
  useEffect(() => { loadDataAsync().then(setData); }, []);

  const last30Days = useMemo(() => Array.from({ length: 30 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return d.toISOString().split('T')[0]; }).reverse(), []);

  const studyByDay = useMemo(() => last30Days.map((date) => ({ date: date.slice(5), minutes: data.studySessions.filter((s) => s.date === date).reduce((sum, s) => sum + s.durationMinutes, 0) })), [last30Days, data]);

  const tasksByDay = useMemo(() => last30Days.map((date) => { const log = data.dailyLogs.find((l) => l.date === date); const tasks = log?.tasks ?? []; return { date: date.slice(5), total: tasks.length, completed: tasks.filter((t) => t.completed).length }; }), [last30Days, data]);

  const problemsByCategory = useMemo(() => (['grammar', 'reading', 'listening', 'speaking', 'spelling', 'collocations', 'writing'] as Category[]).map((cat) => ({
    category: CATEGORY_LABELS[cat],
    total: data.problems.filter((p) => p.category === cat).length,
    solved: data.problems.filter((p) => p.category === cat && p.solved).length,
    color: CATEGORY_COLORS[cat],
  })), [data]);

  const totalStudyMinutes = data.studySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalTasks = data.dailyLogs.reduce((sum, l) => sum + l.tasks.length, 0);
  const totalCompleted = data.dailyLogs.reduce((sum, l) => sum + l.tasks.filter((t) => t.completed).length, 0);
  const totalProblems = data.problems.length;
  const solvedProblems = data.problems.filter((p) => p.solved).length;
  const totalCollocations = data.collocations.length;
  const masteredCollocations = data.collocations.filter((c) => c.mastered).length;
  const maxStudy = Math.max(...studyByDay.map((d) => d.minutes), 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Progress</h1>
        <p className="text-gray-500 mt-1">Track your improvement over time</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MiniStat label="Total Study" value={`${Math.round(totalStudyMinutes / 60)}h ${totalStudyMinutes % 60}m`} />
        <MiniStat label="Tasks Done" value={`${totalCompleted}/${totalTasks}`} />
        <MiniStat label="Completion" value={`${totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0}%`} />
        <MiniStat label="Problems" value={`${solvedProblems}/${totalProblems} solved`} />
        <MiniStat label="Collocations" value={`${masteredCollocations}/${totalCollocations}`} />
        <MiniStat label="Days Tracked" value={`${new Set(data.dailyLogs.map((l) => l.date)).size}`} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Study Time (Last 30 Days)</h2>
        <div className="flex items-end gap-1 h-48 overflow-x-auto">
          {studyByDay.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1 min-w-[16px]">
              <div className="w-full bg-blue-500 rounded-t-sm transition-all hover:bg-blue-600" style={{ height: `${(d.minutes / maxStudy) * 100}%`, minHeight: d.minutes > 0 ? '4px' : '0' }} title={`${d.date}: ${d.minutes} min`} />
              {i % 5 === 0 && <span className="text-[10px] text-gray-400">{d.date}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Tasks (Last 10 Days)</h2>
          <div className="space-y-2">
            {tasksByDay.slice(-10).reverse().map((d, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-10">{d.date}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${d.total > 0 ? (d.completed / d.total) * 100 : 0}%` }} />
                </div>
                <span className="text-xs text-gray-600 w-12 text-right">{d.completed}/{d.total}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Problems by Category</h2>
          <div className="space-y-4">
            {problemsByCategory.map((cat) => (
              <div key={cat.category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">{cat.category}</span>
                  <span className="text-xs text-gray-500">{cat.solved}/{cat.total}</span>
                </div>
                <div className="bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${cat.total > 0 ? (cat.solved / cat.total) * 100 : 0}%`, backgroundColor: cat.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Study by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {(['grammar', 'reading', 'listening', 'speaking', 'spelling', 'collocations', 'writing'] as Category[]).map((cat) => {
            const mins = data.studySessions.filter((s) => s.category === cat).reduce((sum, s) => sum + s.durationMinutes, 0);
            return (
              <div key={cat} className="text-center p-4 rounded-lg" style={{ backgroundColor: `${CATEGORY_COLORS[cat]}10` }}>
                <p className="text-2xl font-bold" style={{ color: CATEGORY_COLORS[cat] }}>{mins}m</p>
                <p className="text-sm text-gray-600 mt-1">{CATEGORY_LABELS[cat]}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return <div className="bg-white border border-gray-200 rounded-xl p-4 text-center"><p className="text-xs text-gray-500">{label}</p><p className="text-lg font-bold text-gray-800 mt-1">{value}</p></div>;
}
