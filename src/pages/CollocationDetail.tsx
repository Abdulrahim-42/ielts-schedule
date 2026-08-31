import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadDataAsync, updateCollocationAsync, deleteCollocationAsync } from '../utils/localStorage';
import type { Collocation, AppData } from '../types';

const EMPTY: AppData = { dailyLogs: [], problems: [], collocations: [], studySessions: [], essays: [], writingMistakes: [] };

const LEVEL_LABELS = ['New', 'Learning 1', 'Learning 2', 'Familiar', 'Known', 'Mastered'];
const LEVEL_COLORS = ['bg-gray-100 text-gray-600', 'bg-red-100 text-red-700', 'bg-orange-100 text-orange-700', 'bg-yellow-100 text-yellow-700', 'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700'];

export default function CollocationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<AppData>(EMPTY);
  const [col, setCol] = useState<Collocation | null>(null);

  const reload = () => loadDataAsync().then((d) => {
    setData(d);
    setCol(d.collocations.find((c) => c.id === id) || null);
  });

  useEffect(() => { reload(); }, [id]);

  const toggleMastered = async () => {
    if (!col) return;
    const newMastered = !col.mastered;
    await updateCollocationAsync({ ...col, mastered: newMastered, level: newMastered ? 5 : 0 });
    await reload();
  };

  const handleDelete = async () => {
    if (!col) return;
    await deleteCollocationAsync(col.id);
    navigate('/collocations');
  };

  if (!col) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400 text-lg">Collocation not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/collocations')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{col.phrase}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${LEVEL_COLORS[col.level] || LEVEL_COLORS[0]}`}>
              {LEVEL_LABELS[col.level] || 'New'}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: col.mastered ? '#dcfce7' : '#fce7f3', color: col.mastered ? '#166534' : '#9d174d' }}>
              {col.mastered ? 'Mastered' : 'Not Mastered'}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">{col.context === 'both' ? 'Speaking & Writing' : col.context}</span>
          </div>
        </div>
      </div>

      {/* Definition */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        {col.definition && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Definition</p>
            <p className="text-gray-600">{col.definition}</p>
          </div>
        )}
        {col.note && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Note</p>
            <p className="text-gray-600 italic">{col.note}</p>
          </div>
        )}
        {col.synonyms.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Synonyms</p>
            <div className="flex flex-wrap gap-2">
              {col.synonyms.map((s) => (
                <span key={s} className="text-sm px-3 py-1 rounded-full bg-pink-100 text-pink-700 font-medium">≈ {s}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* IELTS Examples */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">IELTS Examples</h2>

        {col.writingTask1Example && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </div>
              <p className="text-sm font-semibold text-blue-700">Writing Task 1</p>
            </div>
            <p className="text-gray-700 leading-relaxed">{col.writingTask1Example}</p>
          </div>
        )}

        {col.writingTask2Example && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </div>
              <p className="text-sm font-semibold text-purple-700">Writing Task 2</p>
            </div>
            <p className="text-gray-700 leading-relaxed">{col.writingTask2Example}</p>
          </div>
        )}

        {col.speakingExample && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </div>
              <p className="text-sm font-semibold text-green-700">Speaking</p>
            </div>
            <p className="text-gray-700 leading-relaxed">{col.speakingExample}</p>
          </div>
        )}
      </div>

      {/* Topics */}
      {col.topics.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {col.topics.map((t) => (
            <span key={t} className="text-xs px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 font-medium">{t}</span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button onClick={toggleMastered} className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${col.mastered ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
          {col.mastered ? 'Undo Mastered' : 'Mark as Mastered'}
        </button>
        <button onClick={handleDelete} className="px-5 py-2.5 rounded-xl text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors">
          Delete
        </button>
      </div>
    </div>
  );
}
