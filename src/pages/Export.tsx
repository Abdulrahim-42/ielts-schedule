import { useMemo, useState, useEffect } from 'react';
import { loadDataAsync } from '../utils/localStorage';
import { exportToJSON, exportToCSV } from '../utils/export';
import type { AppData } from '../types';

const EMPTY: AppData = { dailyLogs: [], problems: [], collocations: [], studySessions: [], essays: [] };

export default function Export() {
  const [data, setData] = useState<AppData>(EMPTY);
  useEffect(() => { loadDataAsync().then(setData); }, []);

  const stats = useMemo(() => ({
    dailyLogs: data.dailyLogs.length,
    problems: data.problems.length,
    collocations: data.collocations.length,
    studySessions: data.studySessions.length,
    essays: data.essays.length,
    totalStudyMinutes: data.studySessions.reduce((sum, s) => sum + s.durationMinutes, 0),
  }), [data]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Export Data</h1>
        <p className="text-gray-500 mt-1">Download your IELTS tracking data</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <StatCard label="Daily Logs" value={stats.dailyLogs} />
        <StatCard label="Problems" value={stats.problems} />
        <StatCard label="Collocations" value={stats.collocations} />
        <StatCard label="Study Sessions" value={stats.studySessions} />
        <StatCard label="Essays" value={stats.essays} />
        <StatCard label="Total Study" value={`${stats.totalStudyMinutes} min`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">📄</div>
            <h2 className="text-xl font-semibold text-gray-800">Export as JSON</h2>
            <p className="text-sm text-gray-500 mt-2">Complete data backup. Can be imported back later.</p>
          </div>
          <button onClick={() => exportToJSON(data)} className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">Download JSON</button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">📊</div>
            <h2 className="text-xl font-semibold text-gray-800">Export as CSV</h2>
            <p className="text-sm text-gray-500 mt-2">Spreadsheet format. Open in Excel, Google Sheets, etc.</p>
          </div>
          <button onClick={() => exportToCSV(data)} className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">Download CSV</button>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <h3 className="font-semibold text-green-800 mb-2">Database Mode</h3>
        <p className="text-sm text-green-700">
          Your data is now saved to a SQLite database (ielts-tracker.db). It persists even if you clear browser data.
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return <div className="bg-white border border-gray-200 rounded-xl p-4 text-center"><p className="text-xs text-gray-500">{label}</p><p className="text-lg font-bold text-gray-800 mt-1">{value}</p></div>;
}
