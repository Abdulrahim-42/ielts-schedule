import { useState, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { getTopicsAsync, addTopicAsync, deleteTopicAsync } from '../utils/localStorage';
import type { Topic } from '../types';

export default function Topics() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const load = () => getTopicsAsync().then(setTopics);
  useEffect(() => { load(); }, []);

  const add = async () => {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return;
    try {
      await addTopicAsync(trimmed);
      setInput('');
      setError('');
      load();
    } catch (e: any) {
      setError(e.message.includes('409') ? 'Topic already exists' : 'Failed to add topic');
    }
  };

  const remove = async (id: string) => {
    await deleteTopicAsync(id);
    load();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Topic Categories</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <p className="text-sm text-gray-600 mb-4">
          {topics.length} topics available. These topics are used across Essays, Collocations, and Problems.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="Add new topic..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            onClick={add}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Add Topic
          </button>
        </div>
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-0">
          {topics.map((topic, i) => (
            <div
              key={topic.id}
              className="flex items-center justify-between px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm text-gray-800">{i + 1}. {topic.name}</span>
              <button
                onClick={() => remove(topic.id)}
                className="text-gray-400 hover:text-red-500 text-xs ml-2 flex-shrink-0"
                title="Delete topic"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
        {topics.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">No topics yet. Add one above.</p>
        )}
      </div>
    </div>
  );
}
