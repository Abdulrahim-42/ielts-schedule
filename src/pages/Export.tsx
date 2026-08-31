import { useMemo, useState, useEffect } from 'react';
import { loadDataAsync } from '../utils/localStorage';
import { exportToJSON, exportToCSV } from '../utils/export';
import { exportToPDF } from '../utils/exportPDF';
import type { AppData } from '../types';

const EMPTY: AppData = { dailyLogs: [], problems: [], collocations: [], studySessions: [], essays: [], writingMistakes: [] };

export default function Export() {
  const [data, setData] = useState<AppData>(EMPTY);
  const [includeVocab, setIncludeVocab] = useState(true);
  const [includeSchedule, setIncludeSchedule] = useState(true);
  const [includeProblems, setIncludeProblems] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  useEffect(() => { loadDataAsync().then(setData); }, []);

  const stats = useMemo(() => ({
    dailyLogs: data.dailyLogs.length,
    problems: data.problems.length,
    collocations: data.collocations.length,
    studySessions: data.studySessions.length,
    essays: data.essays.length,
    totalStudyMinutes: data.studySessions.reduce((sum, s) => sum + s.durationMinutes, 0),
  }), [data]);

  const allTopics = useMemo(() => {
    const s = new Set<string>();
    data.collocations.forEach((c) => c.topics.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [data.collocations]);

  const toggleTopic = (t: string) => {
    setSelectedTopics((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const handlePDF = () => {
    exportToPDF(data, {
      includeVocab,
      includeSchedule,
      includeProblems,
      topics: selectedTopics,
    });
  };

  const vocabCount = selectedTopics.length === 0 ? data.collocations.length : data.collocations.filter((c) => c.topics.some((t) => selectedTopics.includes(t))).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Export Data</h1>
        <p className="text-gray-500 mt-1">Download your IELTS tracking data — now with tidy PDF</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <StatCard label="Daily Logs" value={stats.dailyLogs} />
        <StatCard label="Problems" value={stats.problems} />
        <StatCard label="Collocations" value={stats.collocations} />
        <StatCard label="Study Sessions" value={stats.studySessions} />
        <StatCard label="Essays" value={stats.essays} />
        <StatCard label="Total Study" value={`${stats.totalStudyMinutes} min`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">📄</div>
            <h2 className="text-xl font-semibold text-gray-800">Export as JSON</h2>
            <p className="text-sm text-gray-500 mt-2">Complete backup. Can be imported back.</p>
          </div>
          <button onClick={() => exportToJSON(data)} className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">Download JSON</button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">📊</div>
            <h2 className="text-xl font-semibold text-gray-800">Export as CSV</h2>
            <p className="text-sm text-gray-500 mt-2">Spreadsheet for Excel / Sheets.</p>
          </div>
          <button onClick={() => exportToCSV(data)} className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">Download CSV</button>
        </div>

        <div className="bg-white rounded-xl border-2 border-purple-200 p-6 shadow-sm">
          <div className="text-center mb-4">
            <div className="text-4xl mb-3">📕</div>
            <h2 className="text-xl font-semibold text-gray-800">Export as PDF</h2>
            <p className="text-sm text-gray-500 mt-2">Tidy, printable — grouped by topic.</p>
          </div>

          <div className="space-y-3 text-sm">
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={includeVocab} onChange={(e) => setIncludeVocab(e.target.checked)} className="rounded" /><span>Vocabulary by topic ({vocabCount})</span></label>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={includeSchedule} onChange={(e) => setIncludeSchedule(e.target.checked)} className="rounded" /><span>Schedule / Sessions</span></label>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={includeProblems} onChange={(e) => setIncludeProblems(e.target.checked)} className="rounded" /><span>Problems / Mistakes</span></label>
          </div>

          {includeVocab && allTopics.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-600 mb-2">Topics (empty = all):</p>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-auto p-1">
                {allTopics.map((t) => (
                  <button key={t} onClick={() => toggleTopic(t)} className={`text-xs px-2 py-1 rounded-full border ${selectedTopics.includes(t) ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>{t}</button>
                ))}
              </div>
              {selectedTopics.length > 0 && <button onClick={() => setSelectedTopics([])} className="text-xs text-purple-600 mt-2 hover:underline">Clear selection</button>}
            </div>
          )}

          <button onClick={handlePDF} className="w-full mt-5 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors">Download PDF</button>
          <p className="text-xs text-gray-400 text-center mt-2">A4, color-coded tables, page numbers</p>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <h3 className="font-semibold text-green-800 mb-2">Database Mode</h3>
        <p className="text-sm text-green-700">Your data is saved to SQLite (ielts-tracker.db). Persists even if you clear browser data.</p>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return <div className="bg-white border border-gray-200 rounded-xl p-4 text-center"><p className="text-xs text-gray-500">{label}</p><p className="text-lg font-bold text-gray-800 mt-1">{value}</p></div>;
}
