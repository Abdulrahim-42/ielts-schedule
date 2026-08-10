import { CATEGORY_LABELS, CATEGORY_COLORS } from '../types';
import type { Category } from '../types';

interface CategoryTabsProps {
  selected: Category | 'all';
  onChange: (cat: Category | 'all') => void;
  showAll?: boolean;
}

const allCategories: Category[] = ['grammar', 'reading', 'listening', 'speaking', 'spelling', 'collocations', 'writing'];

export default function CategoryTabs({ selected, onChange, showAll = true }: CategoryTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {showAll && (
        <button
          onClick={() => onChange('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selected === 'all'
              ? 'bg-gray-800 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </button>
      )}
      {allCategories.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selected === cat ? 'text-white' : 'text-gray-600 hover:opacity-80'
          }`}
          style={{
            backgroundColor: selected === cat ? CATEGORY_COLORS[cat] : `${CATEGORY_COLORS[cat]}20`,
          }}
        >
          {CATEGORY_LABELS[cat]}
        </button>
      ))}
    </div>
  );
}
