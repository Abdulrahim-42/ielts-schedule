import { useState, useMemo, useEffect } from 'react';
import { loadDataAsync } from '../utils/localStorage';
import type { AppData, Collocation } from '../types';

const EMPTY: AppData = { dailyLogs: [], problems: [], collocations: [], studySessions: [], essays: [], writingMistakes: [] };

export default function Antonyms() {
  const [data, setData] = useState<AppData>(EMPTY);
  const [search, setSearch] = useState('');
  const [topicFilter, setTopicFilter] = useState('');

  const reload = () => loadDataAsync().then(setData);
  useEffect(() => { reload(); }, []);

  const allTopics = useMemo(() => {
    const set = new Set<string>();
    data.collocations.forEach((c) => {
      if ((c.antonyms || []).length > 0) c.topics.forEach((t) => set.add(t));
    });
    return Array.from(set).sort();
  }, [data.collocations]);

  const collocationsWithAntonyms = useMemo(() => {
    let list = data.collocations.filter((c) => (c.antonyms || []).length > 0);
    if (topicFilter) list = list.filter((c) => c.topics.includes(topicFilter));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        c.phrase.toLowerCase().includes(q) ||
        c.definition.toLowerCase().includes(q) ||
        (c.antonyms || []).some((s) => s.toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => a.phrase.localeCompare(b.phrase));
  }, [data.collocations, search, topicFilter]);

  const c16t2Reading = collocationsWithAntonyms.filter((c) => c.note?.includes('Cambridge 16 Test 2 Reading'));
  const otherVocab = collocationsWithAntonyms.filter((c) => !c.note?.includes('Cambridge 16 Test 2 Reading'));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Antonyms</h1>
        <p className="text-gray-500 mt-1">Study opposite meanings for reading comprehension</p>
      </div>

      {c16t2Reading.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-red-800 mb-3">Cambridge 16 Test 2 — Reading Antonyms ({c16t2Reading.length} words)</h2>
          <div className="space-y-3">
            {c16t2Reading.map((col) => (
              <div key={col.id} className="bg-white rounded-lg p-3 border border-red-100">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-gray-800 text-sm">{col.phrase}</span>
                  <span className="text-gray-400">≠</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(col.antonyms || []).map((s) => (
                      <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-medium">{s}</span>
                    ))}
                  </div>
                </div>
                {col.definition && <p className="text-xs text-gray-500 mt-1">{col.definition}</p>}
                {(col.writingTask1Example || col.writingTask2Example || col.speakingExample) && (
                  <div className="text-xs mt-1 space-y-0.5">
                    {col.writingTask1Example && <p className="text-gray-500"><span className="font-medium text-blue-600">W1:</span> {col.writingTask1Example}</p>}
                    {col.writingTask2Example && <p className="text-gray-500"><span className="font-medium text-green-600">W2:</span> {col.writingTask2Example}</p>}
                    {col.speakingExample && <p className="text-gray-500"><span className="font-medium text-purple-600">Sp:</span> {col.speakingExample}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search antonyms..."
        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
      />

      {allTopics.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-500 py-1">Filter by topic:</span>
          <button onClick={() => setTopicFilter('')} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${!topicFilter ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All</button>
          {allTopics.map((t) => (
            <button key={t} onClick={() => setTopicFilter(t)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${topicFilter === t ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{t}</button>
          ))}
        </div>
      )}

      {otherVocab.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-600 mb-3">Other Collocations with Antonyms ({otherVocab.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {otherVocab.map((col) => (
              <AntonymCard key={col.id} collocation={col} />
            ))}
          </div>
        </div>
      )}

      {collocationsWithAntonyms.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">⚡</p>
          <p>No collocations with antonyms yet.</p>
          <p className="text-sm mt-1">Add antonyms to your collocations to track opposites.</p>
        </div>
      )}
    </div>
  );
}

function AntonymCard({ collocation }: { collocation: Collocation }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-800">{collocation.phrase}</h3>
        {collocation.mastered && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">Mastered</span>
        )}
      </div>
      {collocation.definition && (
        <p className="text-sm text-gray-600 mb-2">{collocation.definition}</p>
      )}
      {(collocation.writingTask1Example || collocation.writingTask2Example || collocation.speakingExample) && (
        <div className="text-xs mt-2 space-y-1 border-t border-gray-100 pt-2">
          {collocation.writingTask1Example && <p className="text-gray-600"><span className="font-medium text-blue-600">W1:</span> {collocation.writingTask1Example}</p>}
          {collocation.writingTask2Example && <p className="text-gray-600"><span className="font-medium text-green-600">W2:</span> {collocation.writingTask2Example}</p>}
          {collocation.speakingExample && <p className="text-gray-600"><span className="font-medium text-purple-600">Sp:</span> {collocation.speakingExample}</p>}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {(collocation.antonyms || []).map((s) => (
          <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">{s}</span>
        ))}
      </div>
      {collocation.topics.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {collocation.topics.map((t) => (
            <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium">{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}
