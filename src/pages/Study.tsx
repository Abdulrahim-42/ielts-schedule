import { useState, useMemo, useEffect, useCallback } from 'react';
import { loadDataAsync, updateCollocationAsync } from '../utils/localStorage';
import type { Collocation, AppData } from '../types';
import Flashcard from '../components/Flashcard';

const EMPTY: AppData = { dailyLogs: [], problems: [], collocations: [], studySessions: [], essays: [], writingMistakes: [] };

const INTERVALS = [0, 1, 3, 7, 14, 30];

function getNextReviewDate(level: number): string {
  const days = INTERVALS[Math.min(level, INTERVALS.length - 1)];
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Rating = 'again' | 'hard' | 'good' | 'easy';
interface SessionResult { again: number; hard: number; good: number; easy: number; }

export default function Study() {
  const [data, setData] = useState<AppData>(EMPTY);
  const [topicFilter, setTopicFilter] = useState('');
  const [search, setSearch] = useState('');
  const [started, setStarted] = useState(false);
  const [queue, setQueue] = useState<Collocation[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<SessionResult>({ again: 0, hard: 0, good: 0, easy: 0 });
  const [finished, setFinished] = useState(false);

  const reload = () => loadDataAsync().then(setData);
  useEffect(() => { reload(); }, []);

  const today = new Date().toISOString().split('T')[0];

  const dueCollocations = useMemo(() => {
    let list = data.collocations.filter((c) => !c.mastered && (c.level === 0 || !c.nextReview || c.nextReview <= today));
    if (topicFilter) list = list.filter((c) => c.topics.includes(topicFilter.toLowerCase()));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.phrase.toLowerCase().includes(q));
    }
    return list;
  }, [data.collocations, today, topicFilter, search]);

  const allTopics = useMemo(() => {
    const set = new Set<string>();
    data.collocations.forEach((c) => c.topics.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [data.collocations]);

  const masteredCount = useMemo(() => data.collocations.filter((c) => c.mastered).length, [data.collocations]);

  const startSession = useCallback(() => {
    setQueue(shuffleArray(dueCollocations));
    setCurrentIndex(0);
    setResults({ again: 0, hard: 0, good: 0, easy: 0 });
    setStarted(true);
    setFinished(false);
  }, [dueCollocations]);

  const handleRate = useCallback(async (rating: Rating) => {
    const col = queue[currentIndex];
    if (!col) return;

    let newLevel = col.level;
    switch (rating) {
      case 'again': newLevel = Math.max(0, col.level - 1); break;
      case 'hard': break;
      case 'good': newLevel = Math.min(5, col.level + 1); break;
      case 'easy': newLevel = Math.min(5, col.level + 2); break;
    }

    if (newLevel >= 5) {
      await updateCollocationAsync({ ...col, level: 5, mastered: true, lastReviewed: today, nextReview: '', reviewCount: col.reviewCount + 1 });
    } else {
      await updateCollocationAsync({ ...col, level: newLevel, lastReviewed: today, nextReview: getNextReviewDate(newLevel), reviewCount: col.reviewCount + 1 });
    }

    setResults((prev) => ({ ...prev, [rating]: prev[rating] + 1 }));

    if (currentIndex + 1 >= queue.length) {
      setFinished(true);
      await reload();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [queue, currentIndex, today]);

  const currentCol = queue[currentIndex];
  const totalReviewed = results.again + results.hard + results.good + results.easy;
  const remaining = queue.length - totalReviewed;

  if (!started) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Study</h1>
          <p className="text-gray-500 mt-1">Review collocations with spaced repetition</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{data.collocations.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{masteredCount}</p>
            <p className="text-xs text-gray-500 mt-1">Mastered</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-orange-600">{dueCollocations.length}</p>
            <p className="text-xs text-gray-500 mt-1">Due Today</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-gray-600">{data.collocations.length - masteredCount - dueCollocations.length}</p>
            <p className="text-xs text-gray-500 mt-1">In Progress</p>
          </div>
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

        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search collocations..." className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />

        {dueCollocations.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">🎉</p>
            <p className="text-lg font-medium text-gray-600">All caught up!</p>
            <p className="text-sm mt-1">No collocations due for review today.</p>
          </div>
        ) : (
          <button onClick={startSession} className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl text-lg font-medium hover:bg-blue-700 transition-colors">
            Start Review ({dueCollocations.length} cards)
          </button>
        )}
      </div>
    );
  }

  if (finished) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Session Complete!</h1>
          <p className="text-gray-500 mt-1">Great job reviewing your collocations</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-6">
          <p className="text-5xl font-bold text-gray-800">{totalReviewed}</p>
          <p className="text-gray-500">cards reviewed</p>

          <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">{results.again}</p>
              <p className="text-xs text-gray-500">Again</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-500">{results.hard}</p>
              <p className="text-xs text-gray-500">Hard</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">{results.good}</p>
              <p className="text-xs text-gray-500">Good</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-500">{results.easy}</p>
              <p className="text-xs text-gray-500">Easy</p>
            </div>
          </div>

          <div className="flex gap-4 justify-center pt-4">
            <button onClick={() => { setStarted(false); setFinished(false); }} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">
              Back to Study
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Study</h1>
          <p className="text-gray-500 mt-1">{remaining} cards remaining</p>
        </div>
        <button onClick={() => { setStarted(false); setFinished(false); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
          End Session
        </button>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${(totalReviewed / queue.length) * 100}%` }} />
      </div>

      {currentCol && (
        <Flashcard key={currentCol.id} collocation={currentCol} onRate={handleRate} current={totalReviewed + 1} total={queue.length} />
      )}
    </div>
  );
}
