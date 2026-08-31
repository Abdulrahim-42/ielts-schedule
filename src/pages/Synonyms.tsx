import { useState, useMemo, useEffect } from 'react';
import { loadDataAsync } from '../utils/localStorage';
import type { AppData, Collocation } from '../types';

const EMPTY: AppData = { dailyLogs: [], problems: [], collocations: [], studySessions: [], essays: [], writingMistakes: [] };

export default function Synonyms() {
  const [data, setData] = useState<AppData>(EMPTY);
  const [search, setSearch] = useState('');
  const [topicFilter, setTopicFilter] = useState('');

  const reload = () => loadDataAsync().then(setData);
  useEffect(() => { reload(); }, []);

  const allTopics = useMemo(() => {
    const set = new Set<string>();
    data.collocations.forEach((c) => {
      if (c.synonyms.length > 0) c.topics?.forEach((t) => { if (t) set.add(t); });
    });
    return Array.from(set).sort();
  }, [data.collocations]);

  const collocationsWithSynonyms = useMemo(() => {
    let list = data.collocations.filter((c) => c.synonyms.length > 0);
    if (topicFilter) list = list.filter((c) => c.topics.some((t) => (t || '').toLowerCase() === (topicFilter || '').toLowerCase()));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        c.phrase.toLowerCase().includes(q) ||
        c.definition.toLowerCase().includes(q) ||
        (c.note || '').toLowerCase().includes(q) ||
        (c.writingTask1Example || '').toLowerCase().includes(q) ||
        (c.writingTask2Example || '').toLowerCase().includes(q) ||
        (c.speakingExample || '').toLowerCase().includes(q) ||
        c.topics.some((t) => t.toLowerCase().includes(q)) ||
        c.synonyms.some((s) => s.toLowerCase().includes(q)) ||
        (c.antonyms || []).some((a) => a.toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => a.phrase.localeCompare(b.phrase));
  }, [data.collocations, search, topicFilter]);

  const c15t3Reading = collocationsWithSynonyms.filter((c) => c.note?.includes('Cambridge 15 Test 3'));
  const c15t4Reading = collocationsWithSynonyms.filter((c) => c.note?.includes('Cambridge 15 Test 4'));
  const c16t1Reading = collocationsWithSynonyms.filter((c) => c.note?.includes('Cambridge 16 Test 1 Reading'));
  const c16t2Reading = collocationsWithSynonyms.filter((c) => c.note?.includes('Cambridge 16 Test 2 Reading'));
  const c16t2Listening = collocationsWithSynonyms.filter((c) => c.note?.includes('Cambridge 16 Test 2 Listening'));
  const c16t3Reading = collocationsWithSynonyms.filter((c) => c.note?.includes('Cambridge 16 Test 3 Reading'));
  const c16t3Listening = collocationsWithSynonyms.filter((c) => c.note?.includes('Cambridge 16 Test 3 Listening'));
  const c16t4Listening = collocationsWithSynonyms.filter((c) => c.note?.includes('Cambridge 16 Test 4 Listening'));
  const otherVocab = collocationsWithSynonyms.filter((c) =>
    !c.note?.includes('Cambridge 15 Test 3') &&
    !c.note?.includes('Cambridge 15 Test 4') &&
    !c.note?.includes('Cambridge 16 Test 1 Reading') &&
    !c.note?.includes('Cambridge 16 Test 2 Reading') &&
    !c.note?.includes('Cambridge 16 Test 2 Listening') &&
    !c.note?.includes('Cambridge 16 Test 3 Reading') &&
    !c.note?.includes('Cambridge 16 Test 3 Listening') &&
    !c.note?.includes('Cambridge 16 Test 4 Listening')
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Synonyms</h1>
        <p className="text-gray-500 mt-1">Study paraphrases and synonyms for reading comprehension</p>
      </div>

      {/* Cambridge 15 Test 3 Reading */}
      {c15t3Reading.length > 0 && (
        <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-rose-800 mb-3">Cambridge 15 Test 3 — Reading ({c15t3Reading.length} words)</h2>
          <div className="space-y-3">
            {c15t3Reading.map((col) => (
              <div key={col.id} className="bg-white rounded-lg p-3 border border-rose-100">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-gray-800 text-sm">{col.phrase}</span>
                  <span className="text-gray-400">→</span>
                  <div className="flex flex-wrap gap-1.5">
                    {col.synonyms.map((s) => (
                      <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-medium">{s}</span>
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

      {/* Cambridge 15 Test 4 Reading */}
      {c15t4Reading.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-amber-800 mb-3">Cambridge 15 Test 4 — Reading ({c15t4Reading.length} words)</h2>
          <div className="space-y-3">
            {c15t4Reading.map((col) => (
              <div key={col.id} className="bg-white rounded-lg p-3 border border-amber-100">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-gray-800 text-sm">{col.phrase}</span>
                  <span className="text-gray-400">→</span>
                  <div className="flex flex-wrap gap-1.5">
                    {col.synonyms.map((s) => (
                      <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">{s}</span>
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

      {/* Cambridge 16 Test 1 Reading */}
      {c16t1Reading.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-blue-800 mb-3">Cambridge 16 Test 1 — Reading ({c16t1Reading.length} words)</h2>
          <div className="space-y-3">
            {c16t1Reading.map((col) => (
              <div key={col.id} className="bg-white rounded-lg p-3 border border-blue-100">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-gray-800 text-sm">{col.phrase}</span>
                  <span className="text-gray-400">→</span>
                  <div className="flex flex-wrap gap-1.5">
                    {col.synonyms.map((s) => (
                      <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">{s}</span>
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

      {/* Cambridge 16 Test 2 Reading */}
      {c16t2Reading.length > 0 && (
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-teal-800 mb-3">Cambridge 16 Test 2 — Reading ({c16t2Reading.length} words)</h2>
          <div className="space-y-3">
            {c16t2Reading.map((col) => (
              <div key={col.id} className="bg-white rounded-lg p-3 border border-teal-100">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-gray-800 text-sm">{col.phrase}</span>
                  <span className="text-gray-400">→</span>
                  <div className="flex flex-wrap gap-1.5">
                    {col.synonyms.map((s) => (
                      <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-medium">{s}</span>
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

      {/* Cambridge 16 Test 2 Listening */}
      {c16t2Listening.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-green-800 mb-3">Cambridge 16 Test 2 — Listening ({c16t2Listening.length} words)</h2>
          <div className="space-y-3">
            {c16t2Listening.map((col) => (
              <div key={col.id} className="bg-white rounded-lg p-3 border border-green-100">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-gray-800 text-sm">{col.phrase}</span>
                  <span className="text-gray-400">→</span>
                  <div className="flex flex-wrap gap-1.5">
                    {col.synonyms.map((s) => (
                      <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">{s}</span>
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

      {/* Cambridge 16 Test 3 Reading */}
      {c16t3Reading.length > 0 && (
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-cyan-800 mb-3">Cambridge 16 Test 3 — Reading ({c16t3Reading.length} words)</h2>
          <div className="space-y-3">
            {c16t3Reading.map((col) => (
              <div key={col.id} className="bg-white rounded-lg p-3 border border-cyan-100">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-gray-800 text-sm">{col.phrase}</span>
                  <span className="text-gray-400">→</span>
                  <div className="flex flex-wrap gap-1.5">
                    {col.synonyms.map((s) => (
                      <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-medium">{s}</span>
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

      {/* Cambridge 16 Test 3 Listening */}
      {c16t3Listening.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-purple-800 mb-3">Cambridge 16 Test 3 — Listening ({c16t3Listening.length} words)</h2>
          <div className="space-y-3">
            {c16t3Listening.map((col) => (
              <div key={col.id} className="bg-white rounded-lg p-3 border border-purple-100">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-gray-800 text-sm">{col.phrase}</span>
                  <span className="text-gray-400">→</span>
                  <div className="flex flex-wrap gap-1.5">
                    {col.synonyms.map((s) => (
                      <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium">{s}</span>
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

      {/* Cambridge 16 Test 4 Listening */}
      {c16t4Listening.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-orange-800 mb-3">Cambridge 16 Test 4 — Listening ({c16t4Listening.length} words)</h2>
          <div className="space-y-3">
            {c16t4Listening.map((col) => (
              <div key={col.id} className="bg-white rounded-lg p-3 border border-orange-100">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-gray-800 text-sm">{col.phrase}</span>
                  <span className="text-gray-400">→</span>
                  <div className="flex flex-wrap gap-1.5">
                    {col.synonyms.map((s) => (
                      <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-medium">{s}</span>
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
        placeholder="Search synonyms..."
        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
      />

      {allTopics.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-500 py-1">Filter by topic:</span>
          <button onClick={() => setTopicFilter('')} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${!topicFilter ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All</button>
          {allTopics.map((t) => (
            <button key={t} onClick={() => setTopicFilter(t)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${(topicFilter || '') === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{t}</button>
          ))}
        </div>
      )}

      {/* All Collocations with Synonyms */}
      {otherVocab.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-600 mb-3">Other Collocations with Synonyms ({otherVocab.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {otherVocab.map((col) => (
              <SynonymCard key={col.id} collocation={col} />
            ))}
          </div>
        </div>
      )}

      {collocationsWithSynonyms.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">🔗</p>
          <p>No collocations with synonyms yet.</p>
          <p className="text-sm mt-1">Add synonyms to your collocations to track paraphrases.</p>
        </div>
      )}
    </div>
  );
}

function SynonymCard({ collocation }: { collocation: Collocation }) {
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
        {collocation.synonyms.map((s) => (
          <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 font-medium">{s}</span>
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
