import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import type { QuestionType, Task1Essay } from '../types/task1';
import { QUESTION_TYPE_OPTIONS, QUESTION_TYPE_LABELS } from '../types/task1';
import {
  loadTask1EssaysAsync,
  addTask1EssayAsync,
  deleteTask1EssayAsync,
} from '../utils/localStorage';

const MAX_WORDS = 160;
const WORD_WARNING = 150;
const WORD_SOFT_LIMIT = 200;

export default function WritingTask1() {
  const [essays, setEssays] = useState<Task1Essay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<QuestionType>('bar');
  const [taskPrompt, setTaskPrompt] = useState('');
  const [transcription, setTranscription] = useState('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageBase64, setImageBase64] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const dropRef = useRef<HTMLDivElement>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadTask1EssaysAsync();
      setEssays(data);
    } catch {
      setError('Could not load essays.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      const files = Array.from((e.dataTransfer as DataTransfer)?.files ?? []);
      if (files.length) handleFiles(files);
    };
    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    };
    const el = dropRef.current;
    el?.addEventListener('dragover', onDragOver);
    el?.addEventListener('drop', onDrop);
    return () => {
      el?.removeEventListener('dragover', onDragOver);
      el?.removeEventListener('drop', onDrop);
    };
  }, []);

  const handleFiles = async (files: FileList | File[]) => {
    const f = Array.isArray(files) ? files[0] : files[0];
    if (!f || !f.type.startsWith('image/')) {
      setError('Please upload an image file (jpg, png, webp).');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('Image too large (max 5MB). Please resize and try again.');
      return;
    }
    setSelectedFile(f);
    const reader = new FileReader();
    reader.onload = () => {
      const base = reader.result as string;
      setImageBase64(base);
      setImagePreview(base);
    };
    reader.readAsDataURL(f);
    setError('');
  };

  const wordCount = transcription.trim().split(/\s+/).filter((w) => w.length).length;
  const isOverMax = wordCount > MAX_WORDS;
  const isOverSoft = wordCount > WORD_SOFT_LIMIT;
  const wordColor = isOverSoft ? 'text-red-600' : isOverMax ? 'text-amber-600' : 'text-gray-500';

  const handleSave = async () => {
    if (isOverSoft || wordCount < 15) {
      setError(`Word count is ${wordCount}. Aim for ${MAX_WORDS} words.`);
      return;
    }
    if (!selectedFile && !imagePreview) {
      setError('Please add a chart image.');
      return;
    }
    setSaving(true);
    setError('');
    const id = uuid();
    try {
      await addTask1EssayAsync({
        id,
        questionType: selectedType,
        imageFilename: '',
        imageUrl: '',
        imageUploadBase64: imageBase64 || '',
        taskPrompt,
        transcription,
        dateAdded: new Date().toISOString().split('T')[0],
        wordCount,
      });
      setTranscription('');
      setTaskPrompt('');
      setImagePreview('');
      setImageBase64('');
      setSelectedFile(null);
      await reload();
    } catch {
      setError('Failed to save.');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this Task 1 attempt?')) return;
    try {
      await deleteTask1EssayAsync(id);
      await reload();
    } catch {
      setError('Could not delete.');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Writing Task 1</h1>
          <p className="text-gray-500 mt-1">Save a chart, write your overview + 2 body paragraphs — get your first Task 1 baseline.</p>
        </div>
        <div className="text-sm text-gray-500">Target: {MAX_WORDS} words</div>
      </div>

      {/* Chart type selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {QUESTION_TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSelectedType(opt.value)}
            className={`p-4 rounded-xl border text-center transition-all ${
              selectedType === opt.value
                ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-3xl mb-1">{opt.icon}</div>
            <div className="font-medium text-gray-800">{opt.label}</div>
          </button>
        ))}
      </div>

      {/* Task prompt input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Task Question / Prompt</label>
        <textarea
          value={taskPrompt}
          onChange={(e) => setTaskPrompt(e.target.value)}
          placeholder="Paste the IELTS task question here... e.g. 'The bar chart shows the percentage of people using public transport in four European cities between 2005 and 2015.'"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
        />
      </div>

      {/* Image upload */}
      <div
        ref={dropRef}
        onClick={() => (!selectedFile ? document.getElementById('task1-image')?.click() : undefined)}
        className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-colors"
      >
        {imagePreview ? (
          <img src={imagePreview} alt="chart" className="max-h-52 mx-auto rounded object-contain" />
        ) : (
          <>
            <div className="text-5xl mb-3">🖼️</div>
            <p className="font-medium text-gray-700">Click or drag & drop a chart image</p>
            <p className="text-sm text-gray-500 mt-1">Supports: JPG, PNG, WEBP (max 5MB). Works on mobile.</p>
          </>
        )}
        <input
          id="task1-image"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* Response textarea */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Your Task 1 response</label>
          <span className={wordColor}>
            {wordCount} words {wordCount < 15 && '(too short)'} {isOverSoft && '(over 200 — soft limit)'}
            {isOverMax && !isOverSoft && `(under ${MAX_WORDS})`}
          </span>
        </div>
        <textarea
          value={transcription}
          onChange={(e) => setTranscription(e.target.value)}
          placeholder="Overview: summarise the main trends in 1-2 sentences. Body 1: select & describe the first major feature. Body 2: describe the second. Include at least 2 specific data points (numbers) per body paragraph..."
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={12}
        />
        {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
      </div>

      {/* Saved attempts list */}
      {(() => {
        const sorted = [...essays].sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
        return sorted.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-800">Saved Attempts ({sorted.length})</h2>
            {sorted.map((e) => {
              const isExpanded = expandedId === e.id;
              return (
                <div key={e.id} className="bg-white border rounded-xl overflow-hidden">
                  <div className="p-4 flex items-start gap-3">
                    {e.imageUrl ? (
                      <img src={e.imageUrl} alt="chart" className="w-20 h-20 rounded object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">📊</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{QUESTION_TYPE_LABELS[e.questionType]}</span>
                        <span className="text-xs text-gray-500">{e.dateAdded} · {e.wordCount} words</span>
                      </div>
                      {!isExpanded ? (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{e.transcription.slice(0, 150)}…</p>
                      ) : (
                        <div className="mt-2 space-y-2">
                          {e.imageUrl && (
                            <img src={e.imageUrl} alt="chart full" className="max-h-64 rounded object-contain" />
                          )}
                          <div className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-3 rounded">{e.transcription}</div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button onClick={() => toggleExpand(e.id)} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                        {isExpanded ? 'Collapse' : 'Expand'}
                      </button>
                      <button onClick={() => handleDelete(e.id)} className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200">Delete</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No saved attempts yet.</p>
        );
      })()}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Attempt'}
      </button>
    </div>
  );
}
