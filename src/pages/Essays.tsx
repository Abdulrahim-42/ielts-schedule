import { useState, useMemo, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { loadDataAsync, addEssayAsync, updateEssayAsync, deleteEssayAsync } from '../utils/localStorage';
import type { Essay, AppData } from '../types';
import TopicsInput from '../components/TopicsInput';

const emptyForm = { topic: '', question: '', userEssay: '', highBandEssay: '', lowBandEssay: '', vocabulary: [] as string[], topics: [] as string[] };
const EMPTY: AppData = { dailyLogs: [], problems: [], collocations: [], studySessions: [], essays: [] };

function extractVocabulary(text: string): string[] {
  const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter((w) => w.length > 5);
  const freq: Record<string, number> = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;
  return Object.entries(freq).filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([w]) => w);
}

export default function Essays() {
  const [data, setData] = useState<AppData>(EMPTY);
  const [search, setSearch] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const reload = () => loadDataAsync().then(setData);
  useEffect(() => { reload(); }, []);

  const allTopics = useMemo(() => {
    const set = new Set<string>();
    data.essays.forEach((e) => e.topics.forEach((t) => set.add(t)));
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

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setShowForm(true); };

  const openEdit = (essay: Essay) => {
    setEditingId(essay.id);
    setForm({ topic: essay.topic, question: essay.question, userEssay: essay.userEssay, highBandEssay: essay.highBandEssay, lowBandEssay: essay.lowBandEssay, vocabulary: [...essay.vocabulary], topics: [...essay.topics] });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.topic.trim()) return;
    const vocab = form.vocabulary.length > 0 ? form.vocabulary : extractVocabulary(form.userEssay + ' ' + form.highBandEssay + ' ' + form.lowBandEssay);
    if (editingId) {
      const existing = data.essays.find((e) => e.id === editingId);
      if (existing) {
        await updateEssayAsync({ ...existing, ...form, topic: form.topic.trim(), question: form.question.trim(), userEssay: form.userEssay.trim(), highBandEssay: form.highBandEssay.trim(), lowBandEssay: form.lowBandEssay.trim(), vocabulary: vocab });
      }
    } else {
      await addEssayAsync({ id: uuid(), topic: form.topic.trim(), question: form.question.trim(), userEssay: form.userEssay.trim(), highBandEssay: form.highBandEssay.trim(), lowBandEssay: form.lowBandEssay.trim(), vocabulary: vocab, topics: form.topics, dateAdded: new Date().toISOString().split('T')[0] });
    }
    setForm(emptyForm); setEditingId(null); setShowForm(false);
    await reload();
  };

  const deleteEssay = async (id: string) => { await deleteEssayAsync(id); await reload(); };

  const updateField = (field: string, value: unknown) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Essays</h1>
          <p className="text-gray-500 mt-1">Practice writing and compare band scores</p>
        </div>
        <button onClick={openAdd} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">+ Add Essay</button>
      </div>

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
            <textarea value={form.userEssay} onChange={(e) => updateField('userEssay', e.target.value)} placeholder="Write your essay here..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-40 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Band 8-9 Essay</label>
              <textarea value={form.highBandEssay} onChange={(e) => updateField('highBandEssay', e.target.value)} placeholder="High band sample essay..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-40 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Band 5.5-6.5 Essay</label>
              <textarea value={form.lowBandEssay} onChange={(e) => updateField('lowBandEssay', e.target.value)} placeholder="Lower band sample essay..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-40 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topics</label>
            <TopicsInput topics={form.topics} onChange={(topics) => updateField('topics', topics)} placeholder="e.g. environment, education..." />
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">{editingId ? 'Update' : 'Save'}</button>
            <button onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">Cancel</button>
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
          {essays.map((essay) => (
            <div key={essay.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-100 text-blue-700">{essay.topic}</span>
                    <span className="text-xs text-gray-400">{essay.dateAdded}</span>
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
                  <button onClick={() => setExpandedId(expandedId === essay.id ? null : essay.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">{expandedId === essay.id ? 'Collapse' : 'Expand'}</button>
                  <button onClick={() => openEdit(essay)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">Edit</button>
                  <button onClick={() => deleteEssay(essay.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors">Delete</button>
                </div>
              </div>

              {expandedId === essay.id && (
                <div className="mt-4 space-y-4">
                  {essay.userEssay && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Your Essay</h4>
                      <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">{essay.userEssay}</div>
                    </div>
                  )}
                  {essay.highBandEssay && (
                    <div>
                      <h4 className="text-sm font-semibold text-green-700 mb-2">Band 8-9 Essay</h4>
                      <div className="p-4 bg-green-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">{essay.highBandEssay}</div>
                    </div>
                  )}
                  {essay.lowBandEssay && (
                    <div>
                      <h4 className="text-sm font-semibold text-yellow-700 mb-2">Band 5.5-6.5 Essay</h4>
                      <div className="p-4 bg-yellow-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">{essay.lowBandEssay}</div>
                    </div>
                  )}
                  {essay.vocabulary.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-purple-700 mb-2">Key Vocabulary</h4>
                      <div className="flex flex-wrap gap-2">
                        {essay.vocabulary.map((v) => <span key={v} className="text-xs px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">{v}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
