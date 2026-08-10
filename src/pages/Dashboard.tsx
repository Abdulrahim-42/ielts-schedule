import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { loadDataAsync } from '../utils/localStorage';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../types';
import type { Category, AppData } from '../types';

const EMPTY: AppData = { dailyLogs: [], problems: [], collocations: [], studySessions: [], essays: [] };

export default function Dashboard() {
  const [data, setData] = useState<AppData>(EMPTY);

  useEffect(() => { loadDataAsync().then(setData); }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayLog = data.dailyLogs.find((l) => l.date === today);
  const todayTasks = todayLog?.tasks ?? [];
  const completedToday = todayTasks.filter((t) => t.completed).length;

  const totalStudyMinutes = data.studySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const unsolvedProblems = data.problems.filter((p) => !p.solved).length;
  const totalCollocations = data.collocations.length;
  const masteredCollocations = data.collocations.filter((c) => c.mastered).length;

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const studyByDay = last7Days.map((date) =>
    data.studySessions.filter((s) => s.date === date).reduce((sum, s) => sum + s.durationMinutes, 0)
  );

  const problemsByCategory = (['grammar', 'reading', 'listening', 'speaking', 'spelling', 'collocations', 'writing'] as Category[]).map((cat) => ({
    category: cat,
    count: data.problems.filter((p) => p.category === cat && !p.solved).length,
  }));

  const maxStudy = Math.max(...studyByDay, 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here's your IELTS progress.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Today's Tasks" value={`${completedToday}/${todayTasks.length}`} color="blue" />
        <StatCard label="Study Time" value={`${totalStudyMinutes} min`} color="green" />
        <StatCard label="Problems" value={`${unsolvedProblems} open`} color="amber" />
        <StatCard label="Collocations" value={`${masteredCollocations}/${totalCollocations} mastered`} color="pink" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Study Time (Last 7 Days)</h2>
          <div className="flex items-end gap-2 h-40">
            {studyByDay.map((mins, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-500">{mins}m</span>
                <div className="w-full bg-blue-500 rounded-t-md transition-all" style={{ height: `${Math.max((mins / maxStudy) * 100, 4)}%` }} />
                <span className="text-[10px] text-gray-400">{last7Days[i].slice(5)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Open Problems by Category</h2>
          <div className="space-y-3">
            {problemsByCategory.map(({ category, count }) => (
              <div key={category} className="flex items-center gap-3">
                <span className="w-28 text-sm text-gray-600">{CATEGORY_LABELS[category]}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.max((count / Math.max(...problemsByCategory.map((p) => p.count), 1)) * 100, 0)}%`, backgroundColor: CATEGORY_COLORS[category] }} />
                </div>
                <span className="text-sm font-medium text-gray-700 w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <QuickLink to="/daily-log" label="Log Today's Tasks" icon="📝" />
        <QuickLink to="/problems" label="Add a Problem" icon="⚠️" />
        <QuickLink to="/collocations" label="Add Collocation" icon="📚" />
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = { blue: 'bg-blue-50 text-blue-700', green: 'bg-green-50 text-green-700', amber: 'bg-amber-50 text-amber-700', pink: 'bg-pink-50 text-pink-700' };
  return <div className={`rounded-xl p-5 ${colors[color]}`}><p className="text-sm font-medium opacity-80">{label}</p><p className="text-2xl font-bold mt-1">{value}</p></div>;
}

function QuickLink({ to, label, icon }: { to: string; label: string; icon: string }) {
  return <Link to={to} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"><span className="text-2xl">{icon}</span><span className="font-medium text-gray-700">{label}</span></Link>;
}
