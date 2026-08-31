import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { loadDataAsync, addCollocationAsync, updateCollocationAsync, deleteCollocationAsync } from '../utils/localStorage';
import type { AppData, Collocation } from '../types';

const EMPTY: AppData = { dailyLogs: [], problems: [], collocations: [], studySessions: [], essays: [], writingMistakes: [] };

export default function MyWords() {
  const navigate = useNavigate();
  const [data, setData] = useState<AppData>(EMPTY);
  const [phrase, setPhrase] = useState('');
  const [note, setNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const reload = () => loadDataAsync().then(setData);
  useEffect(() => { reload(); }, []);

  const myWords = useMemo(() => {
    let list = data.collocations.filter((c) => c.source === 'custom');
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        c.phrase.toLowerCase().includes(q) ||
        (c.definition || '').toLowerCase().includes(q) ||
        (c.note || '').toLowerCase().includes(q) ||
        c.topics.some((t) => (t || '').toLowerCase().includes(q)) ||
        (c.synonyms || []).some((s) => s.toLowerCase().includes(q)) ||
        (c.antonyms || []).some((a) => a.toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
  }, [data.collocations, search]);

  // Check which words are used in essays
  const usedInEssays = useMemo(() => {
    const used = new Set<string>();
    const allEssayText = data.essays
      .map((e) => `${e.userEssay} ${e.highBandEssay} ${e.lowBandEssay}`.toLowerCase())
      .join(' ');
    const allTask1Text = ''; // Task 1 essays don't have userEssay field yet
    const combined = allEssayText + allTask1Text;
    myWords.forEach((w) => {
      if (combined.includes(w.phrase.toLowerCase())) {
        used.add(w.id);
      }
    });
    return used;
  }, [data.essays, myWords]);

  const add = async () => {
    const trimmed = phrase.trim();
    if (!trimmed) return;
    await addCollocationAsync({
      id: uuid(),
      phrase: trimmed,
      definition: '',
      writingTask1Example: '',
      writingTask2Example: '',
      speakingExample: '',
      context: 'both',
      dateAdded: new Date().toISOString().split('T')[0],
      mastered: false,
      topics: [],
      level: 0,
      lastReviewed: '',
      nextReview: '',
      reviewCount: 0,
      note: note.trim(),
      source: 'custom',
      synonyms: [],
      antonyms: [],
    });
    setPhrase('');
    setNote('');
    await reload();
  };

  const startEdit = (col: Collocation) => {
    setEditingId(col.id);
    setEditNote(col.note);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const col = data.collocations.find((c) => c.id === editingId);
    if (col) {
      await updateCollocationAsync({ ...col, note: editNote.trim() });
    }
    setEditingId(null);
    await reload();
  };

  const remove = async (id: string) => {
    await deleteCollocationAsync(id);
    await reload();
  };

  const toggleMastered = async (col: Collocation) => {
    const newMastered = !col.mastered;
    await updateCollocationAsync({ ...col, mastered: newMastered, level: newMastered ? 5 : 0 });
    await reload();
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Words</h1>
        <p className="text-gray-500 mt-1">
          Jot down words or phrases you come across. They're added to your vocabulary and are studyable from the Study page.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">Add a word</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="e.g. ubiquitous"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="Optional note (where you found it, reminder...)"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <button
          onClick={add}
          className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + Add Word
        </button>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search your words..."
        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      />

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">{myWords.length} words</h2>
          <span className="text-xs text-gray-500">{usedInEssays.size} used in essays</span>
        </div>

        {myWords.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">
            No words yet. Add your first word above — it will show up under Collocations and in Study.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {myWords.map((col) => (
              <li key={col.id} className="px-6 py-4 flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => navigate(`/collocations/${col.id}`)}
                      className="text-sm font-semibold text-gray-800 hover:text-indigo-600 transition-colors"
                    >
                      {col.phrase}
                    </button>
                    {col.mastered && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">Mastered</span>
                    )}
                    {usedInEssays.has(col.id) && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">Used in essay</span>
                    )}
                  </div>
                  {col.synonyms.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {col.synonyms.map((s) => <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 font-medium">≈ {s}</span>)}
                    </div>
                  )}

                  {editingId === col.id ? (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        placeholder="Note..."
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <button onClick={saveEdit} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors">Save</button>
                      <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-300 transition-colors">Cancel</button>
                    </div>
                  ) : (
                    <>
                      {col.note && <p className="text-sm text-gray-500 mt-1">{col.note}</p>}
                      {!col.note && <p className="text-xs text-gray-300 italic mt-1">No note</p>}
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => copyToClipboard(col.phrase, col.id)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${copiedId === col.id ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    title="Copy to clipboard"
                  >
                    {copiedId === col.id ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={() => toggleMastered(col)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${col.mastered ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                  >
                    {col.mastered ? 'Undo' : 'Mastered'}
                  </button>
                  {editingId !== col.id && (
                    <button onClick={() => startEdit(col)} className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                      Edit note
                    </button>
                  )}
                  <button
                    onClick={() => remove(col.id)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                    title="Delete word"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}