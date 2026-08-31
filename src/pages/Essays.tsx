import { useState, useMemo, useEffect, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { loadDataAsync, addEssayAsync, updateEssayAsync, deleteEssayAsync, addWritingMistakeAsync, scanEssayForMistakesAsync } from '../utils/localStorage';
import type { Essay, Collocation, AppData, WritingMistake } from '../types';
import TopicsInput from '../components/TopicsInput';
import { ERROR_PATTERNS } from '../utils/errorPatterns';

const emptyForm = { topic: '', question: '', userEssay: '', highBandEssay: '', lowBandEssay: '', topics: [] as string[] };
const EMPTY: AppData = { dailyLogs: [], problems: [], collocations: [], studySessions: [], essays: [], writingMistakes: [] };

function highlightCollocations(text: string, collocations: Collocation[], essayTopics: string[]): { __html: string } {
  if (!text || collocations.length === 0) return { __html: text };
  const sorted = [...collocations].sort((a, b) => b.phrase.length - a.phrase.length);
  const pattern = sorted.map((c) => c.phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  if (!pattern) return { __html: text };
  const regex = new RegExp(`\\b(${pattern})\\b`, 'gi');
  const metaMap = new Map<string, { isTopicMatch: boolean }>();
  for (const c of sorted) {
    const isTopicMatch = essayTopics.some((t) => c.topics.includes(t));
    metaMap.set(c.phrase.toLowerCase(), { isTopicMatch });
  }
  const html = text.replace(regex, (match) => {
    const meta = metaMap.get(match.toLowerCase()) || { isTopicMatch: false };
    const cls = meta.isTopicMatch ? 'bg-green-200' : 'bg-yellow-200';
    return `<mark class="${cls} px-0.5 rounded">${match}</mark>`;
  });
  return { __html: html };
}

// Highlight errors in essay text
function highlightErrors(text: string): { __html: string; errorCount: number } {
  if (!text) return { __html: text, errorCount: 0 };
  let html = text;
  let errorCount = 0;
  for (const ep of ERROR_PATTERNS) {
    const matches = html.match(ep.pattern);
    if (matches) {
      errorCount += matches.length;
      html = html.replace(ep.pattern, (match) => `<mark class="bg-red-200 px-0.5 rounded text-red-800" title="${ep.fix} (${ep.category})">${match}</mark>`);
    }
  }
  return { __html: html, errorCount };
}

// Find common errors across all essays
function findCommonErrors(essays: Essay[]): { phrase: string; fix: string; category: string; count: number; essays: string[] }[] {
  const errorMap = new Map<string, { fix: string; category: string; count: number; essays: string[] }>();
  for (const essay of essays) {
    const text = essay.userEssay;
    if (!text) continue;
    const seen = new Set<string>();
    for (const ep of ERROR_PATTERNS) {
      const matches = text.match(ep.pattern);
      if (matches && !seen.has(ep.pattern.source)) {
        seen.add(ep.pattern.source);
        const key = matches[0].toLowerCase();
        const existing = errorMap.get(key);
        if (existing) {
          existing.count += matches.length;
          if (!existing.essays.includes(essay.topic)) existing.essays.push(essay.topic);
        } else {
          errorMap.set(key, { fix: ep.fix, category: ep.category, count: matches.length, essays: [essay.topic] });
        }
      }
    }
  }
  return Array.from(errorMap.entries())
    .map(([phrase, data]) => ({ phrase, ...data }))
    .sort((a, b) => b.count - a.count);
}

export default function Essays() {
  const [data, setData] = useState<AppData>(EMPTY);
  const [search, setSearch] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Compare mode state
  const [compareMode, setCompareMode] = useState(false);
  const [compareLeftId, setCompareLeftId] = useState<string | null>(null);
  const [compareRightId, setCompareRightId] = useState<string | null>(null);

  const reload = () => loadDataAsync().then(setData);
  useEffect(() => { reload(); }, []);

  const allTopics = useMemo(() => {
    const set = new Set<string>();
    data.essays.forEach((e) => e.topics.forEach((t) => set.add(t)));
    data.collocations.forEach((c) => c.topics.forEach((t) => set.add(t)));
    data.problems.forEach((p) => p.topics.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [data]);

  const essays = useMemo(() => {
    let list = data.essays;
    if (topicFilter) list = list.filter((e) => e.topics.includes(topicFilter.toLowerCase()));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((e) => e.topic.toLowerCase().includes(q) || e.question.toLowerCase().includes(q) || e.userEssay.toLowerCase().includes(q) || e.topics.some((t) => t.includes(q)));
    }
    return list.sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
  }, [data.essays, search, topicFilter]);

  const commonErrors = useMemo(() => findCommonErrors(data.essays), [data.essays]);

  const getRelatedCollocations = (essay: Essay): Collocation[] => {
    return data.collocations.filter((c) => essay.topics.some((t) => c.topics.includes(t)));
  };

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setShowForm(true); };

  const openEdit = (essay: Essay) => {
    setEditingId(essay.id);
    setForm({ topic: essay.topic, question: essay.question, userEssay: essay.userEssay, highBandEssay: essay.highBandEssay, lowBandEssay: essay.lowBandEssay, topics: [...essay.topics] });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.topic.trim()) return;
    const essayId = editingId || uuid();
    const taskType = 'task2'; // Default to task2, can be made configurable
    
    if (editingId) {
      const existing = data.essays.find((e) => e.id === editingId);
      if (existing) {
        await updateEssayAsync({ ...existing, ...form, topic: form.topic.trim(), question: form.question.trim(), userEssay: form.userEssay.trim(), highBandEssay: form.highBandEssay.trim(), lowBandEssay: form.lowBandEssay.trim() });
      }
    } else {
      await addEssayAsync({ id: essayId, topic: form.topic.trim(), question: form.question.trim(), userEssay: form.userEssay.trim(), highBandEssay: form.highBandEssay.trim(), lowBandEssay: form.lowBandEssay.trim(), topics: form.topics, dateAdded: new Date().toISOString().split('T')[0] });
    }
    
    // Auto-scan for mistakes
    if (form.userEssay.trim()) {
      try {
        const result = await scanEssayForMistakesAsync(form.userEssay.trim(), taskType, essayId);
        if (result.detected && result.detected.length > 0) {
          const today = new Date().toISOString().split('T')[0];
          for (const detected of result.detected) {
            // Check if mistake already exists
            const existingMistake = data.writingMistakes.find(
              m => m.mistakeText === detected.mistakeText && m.correctText === detected.correctText
            );
            
            if (existingMistake) {
              // Update count and add essay ID
              const updatedEssayIds = [...new Set([...existingMistake.essayIds, essayId])];
              await addWritingMistakeAsync({
                ...existingMistake,
                count: existingMistake.count + 1,
                lastSeen: today,
                essayIds: updatedEssayIds,
              });
            } else {
              // Create new mistake
              await addWritingMistakeAsync({
                id: uuid(),
                mistakeText: detected.mistakeText,
                correctText: detected.correctText,
                category: detected.category as any,
                taskType: taskType as any,
                count: 1,
                firstSeen: today,
                lastSeen: today,
                essayIds: [essayId],
                solved: false,
              });
            }
          }
        }
      } catch (error) {
        console.error('Failed to scan essay for mistakes:', error);
      }
    }
    
    setForm(emptyForm); setEditingId(null); setShowForm(false);
    await reload();
  };

  const deleteEssay = async (id: string) => { await deleteEssayAsync(id); await reload(); };

  const updateField = (field: string, value: unknown) => setForm((prev) => ({ ...prev, [field]: value }));

  const startCompare = (essayId: string) => {
    setCompareMode(true);
    setCompareLeftId(essayId);
    setCompareRightId(null);
  };

  const compareLeft = data.essays.find((e) => e.id === compareLeftId);
  const compareRight = data.essays.find((e) => e.id === compareRightId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Essays</h1>
          <p className="text-gray-500 mt-1">Practice writing, track errors, and compare rewrites</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCompareMode(!compareMode)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${compareMode ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
            {compareMode ? 'Exit Compare' : 'Compare'}
          </button>
          <button onClick={openAdd} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">+ Add Essay</button>
        </div>
      </div>

      {/* Common Errors Panel */}
      {commonErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-red-800 mb-2">Recurring Errors ({commonErrors.length} patterns found)</h2>
          <div className="flex flex-wrap gap-2">
            {commonErrors.slice(0, 10).map((err) => (
              <div key={err.phrase} className="bg-white border border-red-200 rounded-lg px-3 py-1.5 text-xs">
                <span className="font-medium text-red-700">{err.phrase}</span>
                <span className="text-gray-500 mx-1">→</span>
                <span className="text-green-700">{err.fix}</span>
                <span className="text-gray-400 ml-1">({err.count}x)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">{editingId ? 'Edit Essay' : 'New Essay'}</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
            <input type="text" value={form.topic} onChange={(e) => updateField('topic', e.target.value)} placeholder="e.g. Environment, Education, Technology..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question / Prompt</label>
            <textarea value={form.question} onChange={(e) => updateField('question', e.target.value)} placeholder="The essay question or prompt..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-20 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Essay</label>
            <textarea value={form.userEssay} onChange={(e) => updateField('userEssay', e.target.value)} placeholder="Write your essay here..." className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-mono h-40 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Band 5.5-6.5 Essay</label>
              <textarea value={form.lowBandEssay} onChange={(e) => updateField('lowBandEssay', e.target.value)} placeholder="Lower band sample essay..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-40 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Band 8-9 Essay</label>
              <textarea value={form.highBandEssay} onChange={(e) => updateField('highBandEssay', e.target.value)} placeholder="High band sample essay..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-40 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topics</label>
            <TopicsInput topics={form.topics} onChange={(topics) => updateField('topics', topics)} />
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">{editingId ? 'Update' : 'Save'}</button>
            <button onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Compare Mode: Select two essays */}
      {compareMode && !compareLeftId && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-purple-800 mb-2">Select the FIRST essay (original)</h2>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {essays.map((e) => (
              <button key={e.id} onClick={() => setCompareLeftId(e.id)} className="w-full text-left p-3 rounded-lg bg-white border border-purple-200 hover:border-purple-400 transition-colors">
                <span className="text-sm font-medium text-gray-800">{e.topic}</span>
                <span className="text-xs text-gray-500 ml-2">{e.dateAdded} · {e.userEssay.split(/\s+/).length} words</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {compareMode && compareLeftId && !compareRightId && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-purple-800 mb-2">Select the SECOND essay (rewrite)</h2>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {essays.filter((e) => e.id !== compareLeftId).map((e) => (
              <button key={e.id} onClick={() => setCompareRightId(e.id)} className="w-full text-left p-3 rounded-lg bg-white border border-purple-200 hover:border-purple-400 transition-colors">
                <span className="text-sm font-medium text-gray-800">{e.topic}</span>
                <span className="text-xs text-gray-500 ml-2">{e.dateAdded} · {e.userEssay.split(/\s+/).length} words</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Side-by-side comparison */}
      {compareMode && compareLeft && compareRight && (
        <div className="bg-white border border-purple-200 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-purple-800">Side-by-side comparison</h2>
            <button onClick={() => { setCompareLeftId(null); setCompareRightId(null); setCompareMode(false); }} className="text-xs text-gray-500 hover:text-gray-700">Close</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">ORIGINAL — {compareLeft.topic} ({compareLeft.dateAdded})</div>
              <div className="p-3 bg-red-50 rounded-lg text-sm font-mono whitespace-pre-wrap max-h-96 overflow-y-auto" dangerouslySetInnerHTML={highlightErrors(compareLeft.userEssay)} />
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">REWRITE — {compareRight.topic} ({compareRight.dateAdded})</div>
              <div className="p-3 bg-green-50 rounded-lg text-sm font-mono whitespace-pre-wrap max-h-96 overflow-y-auto" dangerouslySetInnerHTML={highlightErrors(compareRight.userEssay)} />
            </div>
          </div>
          <div className="text-xs text-gray-500 text-center">
            <span className="text-red-600">Red = errors</span> · <span className="text-green-600">Green = fixed</span> · Hover red marks to see the fix
          </div>
        </div>
      )}

      <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search essays..." className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />

      {allTopics.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-500 py-1">Filter by topic:</span>
          <button onClick={() => setTopicFilter('')} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${!topicFilter ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All</button>
          {allTopics.map((t) => (
            <button key={t} onClick={() => setTopicFilter(t)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${topicFilter === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{t}</button>
          ))}
        </div>
      )}

      {essays.length === 0 ? (
        <div className="text-center py-12 text-gray-400"><p className="text-4xl mb-3">📝</p><p>No essays yet. Start writing!</p></div>
      ) : (
        <div className="space-y-4">
          {essays.map((essay) => {
            const related = getRelatedCollocations(essay);
            const { errorCount } = highlightErrors(essay.userEssay);
            return (
              <div key={essay.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-100 text-blue-700">{essay.topic}</span>
                      <span className="text-xs text-gray-400">{essay.dateAdded}</span>
                      {errorCount > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">{errorCount} errors detected</span>}
                      {related.length > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 font-medium">{related.length} collocations</span>}
                    </div>
                    <h3 className="font-semibold text-gray-800">{essay.topic}</h3>
                    {essay.question && <p className="text-sm text-gray-600 mt-1 italic">{essay.question}</p>}
                    {essay.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {essay.topics.map((t) => <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium">{t}</span>)}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4 flex-shrink-0">
                    {compareMode && (
                      <button onClick={() => setCompareLeftId(essay.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors">Select</button>
                    )}
                    <button onClick={() => setExpandedId(expandedId === essay.id ? null : essay.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">{expandedId === essay.id ? 'Collapse' : 'Expand'}</button>
                    <button onClick={() => openEdit(essay)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">Edit</button>
                    <button onClick={() => startCompare(essay.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors">Compare</button>
                    <button onClick={() => deleteEssay(essay.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors">Delete</button>
                  </div>
                </div>

                {expandedId === essay.id && (
                  <div className="mt-4 space-y-4">
                    {essay.userEssay && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Your Essay <span className="font-normal text-gray-400">(<span className="text-green-600">green</span> = collocation used, <span className="text-yellow-600">yellow</span> = available, <span className="text-red-600">red</span> = error)</span></h4>
                        <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap" dangerouslySetInnerHTML={(() => {
                          let html = highlightCollocations(essay.userEssay, data.collocations, essay.topics).__html;
                          // Now overlay error highlights on top
                          for (const ep of ERROR_PATTERNS) {
                            html = html.replace(new RegExp(`(?<!<mark[^>]*>)(${ep.pattern.source})`, 'gi'), (match) => `<mark class="bg-red-200 px-0.5 rounded text-red-800" title="${ep.fix} (${ep.category})">${match}</mark>`);
                          }
                          return { __html: html };
                        })()} />
                      </div>
                    )}
                    {essay.lowBandEssay && (
                      <div>
                        <h4 className="text-sm font-semibold text-yellow-700 mb-2">Band 5.5-6.5 Essay</h4>
                        <div className="p-4 bg-yellow-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap" dangerouslySetInnerHTML={highlightCollocations(essay.lowBandEssay, data.collocations, essay.topics)} />
                      </div>
                    )}
                    {essay.highBandEssay && (
                      <div>
                        <h4 className="text-sm font-semibold text-green-700 mb-2">Band 8-9 Essay</h4>
                        <div className="p-4 bg-green-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap" dangerouslySetInnerHTML={highlightCollocations(essay.highBandEssay, data.collocations, essay.topics)} />
                      </div>
                    )}

                    {related.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-pink-700 mb-2">Related Collocations</h4>
                        <div className="space-y-2">
                          {related.map((c) => {
                            const allText = `${essay.userEssay} ${essay.highBandEssay} ${essay.lowBandEssay}`.toLowerCase();
                            const isUsed = allText.includes(c.phrase.toLowerCase());
                            return (
                              <div key={c.id} className={`p-3 rounded-lg ${isUsed ? 'bg-green-50 border border-green-200' : 'bg-pink-50'}`}>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-pink-800">{c.phrase}</span>
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-pink-100 text-pink-600">{c.context}</span>
                                  {isUsed && <span className="text-xs px-2 py-0.5 rounded-full bg-green-600 text-white font-medium">Used in essay</span>}
                                  {!isUsed && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">Available</span>}
                                  {c.mastered && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Mastered</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
