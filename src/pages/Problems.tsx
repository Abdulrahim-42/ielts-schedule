import { useState, useMemo, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { loadDataAsync, addProblemAsync, updateProblemAsync, deleteProblemAsync } from '../utils/localStorage';
import type { Category, Problem, AppData } from '../types';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../types';
import CategoryTabs from '../components/CategoryTabs';
import TopicsInput from '../components/TopicsInput';

const emptyForm = { category: 'grammar' as Category, title: '', description: '', example: '', topics: [] as string[] };
const EMPTY: AppData = { dailyLogs: [], problems: [], collocations: [], studySessions: [], essays: [] };

export default function Problems() {
  const [data, setData] = useState<AppData>(EMPTY);
  const [filter, setFilter] = useState<Category | 'all'>('all');
  const [topicFilter, setTopicFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const reload = () => loadDataAsync().then(setData);
  useEffect(() => { reload(); }, []);

  const allTopics = useMemo(() => {
    const set = new Set<string>();
    data.problems.forEach((p) => p.topics.forEach((t) => set.add(t)));
    data.collocations.forEach((c) => c.topics.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [data]);

  const problems = useMemo(() => {
    let list = data.problems;
    if (filter !== 'all') list = list.filter((p) => p.category === filter);
    if (topicFilter) list = list.filter((p) => p.topics.includes(topicFilter.toLowerCase()));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.example.toLowerCase().includes(q) || p.topics.some((t) => t.includes(q)));
    }
    return list.sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
  }, [data.problems, filter, search, topicFilter]);

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setShowForm(true); };

  const openEdit = (problem: Problem) => {
    setEditingId(problem.id);
    setForm({ category: problem.category, title: problem.title, description: problem.description, example: problem.example, topics: [...problem.topics] });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    if (editingId) {
      const existing = data.problems.find((p) => p.id === editingId);
      if (existing) {
        await updateProblemAsync({ ...existing, ...form, title: form.title.trim(), description: form.description.trim(), example: form.example.trim() });
      }
    } else {
      await addProblemAsync({ id: uuid(), category: form.category, title: form.title.trim(), description: form.description.trim(), example: form.example.trim(), dateAdded: new Date().toISOString().split('T')[0], solved: false, topics: form.topics });
    }
    setForm(emptyForm); setEditingId(null); setShowForm(false);
    await reload();
  };

  const toggleSolved = async (id: string) => {
    const p = data.problems.find((p) => p.id === id);
    if (p) { await updateProblemAsync({ ...p, solved: !p.solved }); await reload(); }
  };

  const deleteProblem = async (id: string) => { await deleteProblemAsync(id); await reload(); };

  const updateField = (field: string, value: unknown) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Problems</h1>
          <p className="text-gray-500 mt-1">Track your mistakes and learn from them</p>
        </div>
        <button onClick={openAdd} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">+ Add Problem</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">{editingId ? 'Edit Problem' : 'New Problem'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={form.category} onChange={(e) => updateField('category', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input type="text" value={form.title} onChange={(e) => updateField('title', e.target.value)} placeholder="e.g. Wrong use of past perfect" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Describe the problem in detail..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-20 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Example</label>
            <textarea value={form.example} onChange={(e) => updateField('example', e.target.value)} placeholder="Example of the mistake and its correction..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-20 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
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

      <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search problems..." className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />

      <CategoryTabs selected={filter} onChange={setFilter} />

      {allTopics.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-500 py-1">Filter by topic:</span>
          <button onClick={() => setTopicFilter('')} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${!topicFilter ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All</button>
          {allTopics.map((t) => (
            <button key={t} onClick={() => setTopicFilter(t)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${topicFilter === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{t}</button>
          ))}
        </div>
      )}

      {problems.length === 0 ? (
        <div className="text-center py-12 text-gray-400"><p className="text-4xl mb-3">📝</p><p>No problems logged yet. Start tracking your mistakes!</p></div>
      ) : (
        <div className="space-y-3">
          {problems.map((problem) => (
            <div key={problem.id} className={`bg-white rounded-xl border p-5 transition-all ${problem.solved ? 'border-green-200 bg-green-50/50' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: `${CATEGORY_COLORS[problem.category]}20`, color: CATEGORY_COLORS[problem.category] }}>{CATEGORY_LABELS[problem.category]}</span>
                    <span className="text-xs text-gray-400">{problem.dateAdded}</span>
                    {problem.solved && <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">Solved</span>}
                  </div>
                  <h3 className="font-semibold text-gray-800">{problem.title}</h3>
                  {problem.description && <p className="text-sm text-gray-600 mt-1">{problem.description}</p>}
                  {problem.example && <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 italic">{problem.example}</div>}
                  {problem.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {problem.topics.map((t) => <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium">{t}</span>)}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4 flex-shrink-0">
                  <button onClick={() => openEdit(problem)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">Edit</button>
                  <button onClick={() => toggleSolved(problem.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${problem.solved ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>{problem.solved ? 'Undo' : 'Solved'}</button>
                  <button onClick={() => deleteProblem(problem.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
