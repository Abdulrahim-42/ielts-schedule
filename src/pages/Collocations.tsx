import { useState, useMemo, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { loadDataAsync, addCollocationAsync, updateCollocationAsync, deleteCollocationAsync } from '../utils/localStorage';
import type { Collocation, AppData } from '../types';
import TopicsInput from '../components/TopicsInput';

type FilterType = 'all' | 'speaking' | 'writing' | 'both';
const emptyForm = { phrase: '', meaning: '', usage: '', context: 'both' as 'speaking' | 'writing' | 'both', topics: [] as string[] };
const EMPTY: AppData = { dailyLogs: [], problems: [], collocations: [], studySessions: [], essays: [] };

export default function Collocations() {
  const [data, setData] = useState<AppData>(EMPTY);
  const [filter, setFilter] = useState<FilterType>('all');
  const [topicFilter, setTopicFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const reload = () => loadDataAsync().then(setData);
  useEffect(() => { reload(); }, []);

  const allTopics = useMemo(() => {
    const set = new Set<string>();
    data.collocations.forEach((c) => c.topics.forEach((t) => set.add(t)));
    data.problems.forEach((p) => p.topics.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [data]);

  const collocations = useMemo(() => {
    let list = data.collocations;
    if (filter !== 'all') list = list.filter((c) => c.context === filter);
    if (topicFilter) list = list.filter((c) => c.topics.includes(topicFilter.toLowerCase()));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.phrase.toLowerCase().includes(q) || c.meaning.toLowerCase().includes(q) || c.usage.toLowerCase().includes(q) || c.topics.some((t) => t.includes(q)));
    }
    return list.sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
  }, [data.collocations, filter, search, topicFilter]);

  const masteredCount = data.collocations.filter((c) => c.mastered).length;

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setShowForm(true); };

  const openEdit = (col: Collocation) => {
    setEditingId(col.id);
    setForm({ phrase: col.phrase, meaning: col.meaning, usage: col.usage, context: col.context, topics: [...col.topics] });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.phrase.trim()) return;
    if (editingId) {
      const existing = data.collocations.find((c) => c.id === editingId);
      if (existing) {
        await updateCollocationAsync({ ...existing, ...form, phrase: form.phrase.trim(), meaning: form.meaning.trim(), usage: form.usage.trim() });
      }
    } else {
      await addCollocationAsync({ id: uuid(), phrase: form.phrase.trim(), meaning: form.meaning.trim(), usage: form.usage.trim(), context: form.context, dateAdded: new Date().toISOString().split('T')[0], mastered: false, topics: form.topics });
    }
    setForm(emptyForm); setEditingId(null); setShowForm(false);
    await reload();
  };

  const toggleMastered = async (id: string) => {
    const c = data.collocations.find((c) => c.id === id);
    if (c) { await updateCollocationAsync({ ...c, mastered: !c.mastered }); await reload(); }
  };

  const deleteCollocation = async (id: string) => { await deleteCollocationAsync(id); await reload(); };

  const updateField = (field: string, value: unknown) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Collocations</h1>
          <p className="text-gray-500 mt-1">Master useful collocations for speaking & writing ({masteredCount}/{data.collocations.length} mastered)</p>
        </div>
        <button onClick={openAdd} className="px-4 py-2 bg-pink-600 text-white rounded-lg text-sm font-medium hover:bg-pink-700 transition-colors">+ Add Collocation</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">{editingId ? 'Edit Collocation' : 'New Collocation'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Collocation / Phrase</label>
              <input type="text" value={form.phrase} onChange={(e) => updateField('phrase', e.target.value)} placeholder="e.g. make a decision" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meaning</label>
              <input type="text" value={form.meaning} onChange={(e) => updateField('meaning', e.target.value)} placeholder="e.g. to decide something" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Example Usage</label>
            <textarea value={form.usage} onChange={(e) => updateField('usage', e.target.value)} placeholder="e.g. I need to make a decision about my future career." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-20 focus:ring-2 focus:ring-pink-500 focus:border-pink-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Useful for</label>
            <div className="flex gap-3">
              {(['speaking', 'writing', 'both'] as const).map((ctx) => (
                <button key={ctx} type="button" onClick={() => updateField('context', ctx)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${form.context === ctx ? 'bg-pink-600 text-white' : 'bg-pink-100 text-pink-700 hover:bg-pink-200'}`}>
                  {ctx === 'both' ? 'Speaking & Writing' : ctx.charAt(0).toUpperCase() + ctx.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topics</label>
            <TopicsInput topics={form.topics} onChange={(topics) => updateField('topics', topics)} placeholder="e.g. environment, technology..." />
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} className="px-6 py-2 bg-pink-600 text-white rounded-lg text-sm font-medium hover:bg-pink-700 transition-colors">{editingId ? 'Update' : 'Save'}</button>
            <button onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search collocations..." className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500" />

      <div className="flex gap-2 flex-wrap">
        {(['all', 'speaking', 'writing', 'both'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f === 'all' ? 'All' : f === 'both' ? 'Speaking & Writing' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {allTopics.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-500 py-1">Filter by topic:</span>
          <button onClick={() => setTopicFilter('')} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${!topicFilter ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All</button>
          {allTopics.map((t) => (
            <button key={t} onClick={() => setTopicFilter(t)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${topicFilter === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{t}</button>
          ))}
        </div>
      )}

      {collocations.length === 0 ? (
        <div className="text-center py-12 text-gray-400"><p className="text-4xl mb-3">📚</p><p>No collocations yet. Start building your vocabulary!</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {collocations.map((col) => (
            <div key={col.id} className={`bg-white rounded-xl border p-5 transition-all ${col.mastered ? 'border-green-200 bg-green-50/50' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-800 text-lg">{col.phrase}</h3>
                <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: col.mastered ? '#dcfce7' : '#fce7f3', color: col.mastered ? '#166534' : '#9d174d' }}>
                  {col.mastered ? 'Mastered' : col.context === 'both' ? 'Speaking & Writing' : col.context}
                </span>
              </div>
              {col.meaning && <p className="text-sm text-gray-600 mb-2">{col.meaning}</p>}
              {col.usage && <p className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded-lg">"{col.usage}"</p>}
              {col.topics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {col.topics.map((t) => <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium">{t}</span>)}
                </div>
              )}
              <div className="flex gap-2 mt-3">
                <button onClick={() => openEdit(col)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">Edit</button>
                <button onClick={() => toggleMastered(col.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${col.mastered ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>{col.mastered ? 'Undo' : 'Mastered'}</button>
                <button onClick={() => deleteCollocation(col.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
