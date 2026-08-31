import { useState, useEffect, useRef } from 'react';
import { getTopicsAsync } from '../utils/localStorage';
import type { Topic } from '../types';

interface TopicsInputProps {
  topics: string[];
  onChange: (topics: string[]) => void;
}

export default function TopicsInput({ topics, onChange }: TopicsInputProps) {
  const [allTopics, setAllTopics] = useState<Topic[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getTopicsAsync().then(setAllTopics).catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTopic = (name: string) => {
    if (topics.includes(name)) {
      onChange(topics.filter((t) => t !== name));
    } else {
      onChange([...topics, name]);
    }
  };

  const removeTopic = (name: string) => {
    onChange(topics.filter((t) => t !== name));
  };

  const filtered = search.trim()
    ? allTopics.filter((t) => t.name.toLowerCase().includes(search.trim().toLowerCase()))
    : allTopics;

  return (
    <div ref={wrapperRef} className="relative">
      {topics.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {topics.map((topic) => (
            <span
              key={topic}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700"
            >
              {topic}
              <button
                type="button"
                onClick={() => removeTopic(topic)}
                className="ml-1 text-indigo-400 hover:text-indigo-700"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-left bg-white hover:border-indigo-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex items-center justify-between"
      >
        <span className="text-gray-500">
          {topics.length === 0 ? 'Select topics...' : `${topics.length} topic${topics.length > 1 ? 's' : ''} selected`}
        </span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-auto">
          <div className="sticky top-0 bg-white border-b border-gray-100 p-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topics..."
              className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-indigo-500"
              autoFocus
            />
          </div>
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-400">No topics found</div>
          )}
          {filtered.map((t) => (
            <label
              key={t.id}
              className="flex items-center gap-3 px-3 py-2 hover:bg-indigo-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={topics.includes(t.name)}
                onChange={() => toggleTopic(t.name)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">{t.name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
