import { useState, useEffect } from 'react';
import type { Collocation } from '../types';

const LEVEL_LABELS = ['New', 'Learning 1', 'Learning 2', 'Familiar', 'Known', 'Mastered'];
const LEVEL_COLORS = ['bg-gray-100 text-gray-600', 'bg-red-100 text-red-700', 'bg-orange-100 text-orange-700', 'bg-yellow-100 text-yellow-700', 'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700'];

interface FlashcardProps {
  collocation: Collocation;
  onRate: (rating: 'again' | 'hard' | 'good' | 'easy') => void;
  current: number;
  total: number;
}

export default function Flashcard({ collocation, onRate, current, total }: FlashcardProps) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (flipped) {
        if (e.key === '1') { setFlipped(false); onRate('again'); }
        else if (e.key === '2') { setFlipped(false); onRate('hard'); }
        else if (e.key === '3') { setFlipped(false); onRate('good'); }
        else if (e.key === '4') { setFlipped(false); onRate('easy'); }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [flipped, onRate]);

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">{current} / {total}</span>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${LEVEL_COLORS[collocation.level] || LEVEL_COLORS[0]}`}>
          {LEVEL_LABELS[collocation.level] || 'New'}
        </span>
        <span className="text-sm text-gray-500">Reviews: {collocation.reviewCount}</span>
      </div>

      <div
        onClick={() => setFlipped(!flipped)}
        className="relative w-full cursor-pointer"
        style={{ perspective: '1000px', minHeight: '20rem' }}
      >
        <div
          className="absolute inset-0 transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 bg-white rounded-2xl border-2 border-gray-200 shadow-lg flex flex-col items-center justify-center p-8 hover:border-blue-300 transition-colors"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="text-xs text-gray-400 mb-4">PHRASE</p>
            <p className="text-2xl font-bold text-gray-800 text-center">{collocation.phrase}</p>
            <p className="text-sm text-gray-400 mt-6">Tap to reveal</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 shadow-lg flex flex-col p-6 overflow-y-auto"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            {collocation.definition && (
              <>
                <p className="text-xs text-blue-400 mb-1">DEFINITION</p>
                <p className="text-sm text-gray-600 mb-3">{collocation.definition}</p>
              </>
            )}

            <div className="space-y-2 mt-2">
              {collocation.writingTask1Example && (
                <div className="bg-blue-100/50 rounded-lg p-2">
                  <p className="text-xs font-semibold text-blue-700">Writing Task 1</p>
                  <p className="text-xs text-gray-600">{collocation.writingTask1Example}</p>
                </div>
              )}
              {collocation.writingTask2Example && (
                <div className="bg-purple-100/50 rounded-lg p-2">
                  <p className="text-xs font-semibold text-purple-700">Writing Task 2</p>
                  <p className="text-xs text-gray-600">{collocation.writingTask2Example}</p>
                </div>
              )}
              {collocation.speakingExample && (
                <div className="bg-green-100/50 rounded-lg p-2">
                  <p className="text-xs font-semibold text-green-700">Speaking</p>
                  <p className="text-xs text-gray-600">{collocation.speakingExample}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-auto pt-3">
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{collocation.context}</span>
              {collocation.topics.map((t) => (
                <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {flipped && (
        <div className="mt-6 grid grid-cols-4 gap-3">
          <button onClick={() => { setFlipped(false); onRate('again'); }} className="px-4 py-3 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors">
            Again
          </button>
          <button onClick={() => { setFlipped(false); onRate('hard'); }} className="px-4 py-3 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors">
            Hard
          </button>
          <button onClick={() => { setFlipped(false); onRate('good'); }} className="px-4 py-3 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors">
            Good
          </button>
          <button onClick={() => { setFlipped(false); onRate('easy'); }} className="px-4 py-3 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors">
            Easy
          </button>
        </div>
      )}
    </div>
  );
}
