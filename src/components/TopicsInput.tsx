import { useState } from 'react';

interface TopicsInputProps {
  topics: string[];
  onChange: (topics: string[]) => void;
  placeholder?: string;
}

export default function TopicsInput({ topics, onChange, placeholder = 'Add topic...' }: TopicsInputProps) {
  const [input, setInput] = useState('');

  const addTopic = () => {
    const trimmed = input.trim().toLowerCase();
    if (trimmed && !topics.includes(trimmed)) {
      onChange([...topics, trimmed]);
    }
    setInput('');
  };

  const removeTopic = (topic: string) => {
    onChange(topics.filter((t) => t !== topic));
  };

  return (
    <div>
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
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic())}
          placeholder={placeholder}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <button
          type="button"
          onClick={addTopic}
          className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200 transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}
