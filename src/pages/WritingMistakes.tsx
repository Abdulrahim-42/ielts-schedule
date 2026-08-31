import { useState, useMemo, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { loadDataAsync, updateWritingMistakeAsync, deleteWritingMistakeAsync, addWritingMistakeAsync } from '../utils/localStorage';
import type { AppData, WritingMistake } from '../types';
import { ERROR_PATTERNS } from '../utils/errorPatterns';

const EMPTY: AppData = { dailyLogs: [], problems: [], collocations: [], studySessions: [], essays: [], writingMistakes: [] };

type CategoryFilter = 'all' | 'grammar' | 'spelling' | 'vocabulary' | 'task_response';
type TaskFilter = 'all' | 'task1' | 'task2' | 'both';

const CATEGORY_COLORS: Record<string, string> = {
  grammar: 'bg-blue-100 text-blue-700',
  spelling: 'bg-red-100 text-red-700',
  vocabulary: 'bg-purple-100 text-purple-700',
  task_response: 'bg-orange-100 text-orange-700',
};

const TASK_COLORS: Record<string, string> = {
  task1: 'bg-green-100 text-green-700',
  task2: 'bg-cyan-100 text-cyan-700',
  both: 'bg-gray-100 text-gray-700',
};

export default function WritingMistakes() {
  const [data, setData] = useState<AppData>(EMPTY);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all');
  const [showSolved, setShowSolved] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  const reload = () => loadDataAsync().then(setData);
  useEffect(() => { reload(); }, []);

  const scanAllEssays = async () => {
    setScanning(true);
    setScanResult(null);
    let totalDetected = 0;
    let newMistakes = 0;

    for (const essay of data.essays) {
      const text = essay.userEssay;
      if (!text) continue;

      for (const ep of ERROR_PATTERNS) {
        if (ep.pattern.test(text)) {
          totalDetected++;
          const today = new Date().toISOString().split('T')[0];

          // Check if mistake already exists
          const existingMistake = data.writingMistakes.find(
            m => m.mistakeText === ep.pattern.source && m.correctText === ep.fix
          );

          if (existingMistake) {
            // Update count and add essay ID
            const updatedEssayIds = [...new Set([...existingMistake.essayIds, essay.id])];
            await updateWritingMistakeAsync({
              ...existingMistake,
              count: existingMistake.count + 1,
              lastSeen: today,
              essayIds: updatedEssayIds,
            });
          } else {
            // Create new mistake
            await addWritingMistakeAsync({
              id: uuid(),
              mistakeText: ep.pattern.source,
              correctText: ep.fix,
              category: ep.category,
              taskType: 'both',
              count: 1,
              firstSeen: today,
              lastSeen: today,
              essayIds: [essay.id],
              solved: false,
            });
            newMistakes++;
          }
        }
      }
    }

    await reload();
    setScanning(false);
    setScanResult(`Scanned ${data.essays.length} essays. Found ${totalDetected} mistakes (${newMistakes} new).`);
  };

  const mistakes = useMemo(() => {
    let list = data.writingMistakes;
    if (categoryFilter !== 'all') list = list.filter(m => m.category === categoryFilter);
    if (taskFilter !== 'all') list = list.filter(m => m.taskType === taskFilter);
    if (!showSolved) list = list.filter(m => !m.solved);
    return list.sort((a, b) => b.count - a.count);
  }, [data.writingMistakes, categoryFilter, taskFilter, showSolved]);

  const stats = useMemo(() => {
    const all = data.writingMistakes;
    const unsolved = all.filter(m => !m.solved);
    return {
      total: all.length,
      unsolved: unsolved.length,
      grammar: unsolved.filter(m => m.category === 'grammar').length,
      spelling: unsolved.filter(m => m.category === 'spelling').length,
      vocabulary: unsolved.filter(m => m.category === 'vocabulary').length,
      taskResponse: unsolved.filter(m => m.category === 'task_response').length,
    };
  }, [data.writingMistakes]);

  const handleToggleSolved = async (mistake: WritingMistake) => {
    await updateWritingMistakeAsync({ ...mistake, solved: !mistake.solved });
    await reload();
  };

  const handleDelete = async (id: string) => {
    await deleteWritingMistakeAsync(id);
    await reload();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Writing Mistakes</h1>
        <p className="text-gray-500 mt-1">Track and fix your recurring writing errors</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-xs text-gray-500">Total Mistakes</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.unsolved}</div>
          <div className="text-xs text-gray-500">Unsolved</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.grammar}</div>
          <div className="text-xs text-gray-500">Grammar</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.spelling}</div>
          <div className="text-xs text-gray-500">Spelling</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.vocabulary}</div>
          <div className="text-xs text-gray-500">Vocabulary</div>
        </div>
      </div>

      {/* Scan Button */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-blue-800">Scan Existing Essays</h3>
            <p className="text-xs text-blue-600 mt-1">
              Scan all your essays to detect writing mistakes. Run this once to populate the mistakes from existing essays.
            </p>
          </div>
          <button
            onClick={scanAllEssays}
            disabled={scanning}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              scanning
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {scanning ? 'Scanning...' : 'Scan All Essays'}
          </button>
        </div>
        {scanResult && (
          <p className="text-xs text-green-700 mt-2 bg-green-50 p-2 rounded">{scanResult}</p>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Category:</span>
          {(['all', 'grammar', 'spelling', 'vocabulary', 'task_response'] as CategoryFilter[]).map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                categoryFilter === cat ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat === 'all' ? 'All' : cat === 'task_response' ? 'Task Response' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Task:</span>
          {(['all', 'task1', 'task2', 'both'] as TaskFilter[]).map(task => (
            <button
              key={task}
              onClick={() => setTaskFilter(task)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                taskFilter === task ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {task === 'all' ? 'All' : task === 'task1' ? 'Task 1' : task === 'task2' ? 'Task 2' : 'Both'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showSolved}
              onChange={(e) => setShowSolved(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-600">Show solved</span>
          </label>
        </div>
      </div>

      {/* Mistakes List */}
      {mistakes.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">✨</p>
          <p>No mistakes found. Write an essay to auto-detect errors!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {mistakes.map(mistake => (
            <div
              key={mistake.id}
              className={`bg-white rounded-xl border p-4 ${mistake.solved ? 'border-green-200 opacity-60' : 'border-gray-200'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[mistake.category] || 'bg-gray-100 text-gray-600'}`}>
                      {mistake.category}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TASK_COLORS[mistake.taskType] || 'bg-gray-100 text-gray-600'}`}>
                      {mistake.taskType === 'task1' ? 'Task 1' : mistake.taskType === 'task2' ? 'Task 2' : 'Both'}
                    </span>
                    <span className="text-xs text-gray-400">× {mistake.count}</span>
                    {mistake.solved && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">Solved</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-600 font-medium line-through">{mistake.mistakeText}</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-green-600 font-medium">{mistake.correctText}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    First seen: {mistake.firstSeen} · Last seen: {mistake.lastSeen}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleToggleSolved(mistake)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      mistake.solved
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {mistake.solved ? 'Undo' : 'Solve'}
                  </button>
                  <button
                    onClick={() => handleDelete(mistake.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
