export type QuestionType = 'table' | 'bar' | 'line' | 'pie' | 'process' | 'map' | 'combo';

export interface Task1Essay {
  id: string;
  questionType: QuestionType;
  imageFilename: string;
  imageUrl: string;
  imageUploadBase64?: string;
  taskPrompt: string;
  transcription: string;
  dateAdded: string;
  wordCount: number;
}

export const QUESTION_TYPE_OPTIONS: { value: QuestionType; label: string; icon: string }[] = [
  { value: 'table', label: 'Table', icon: '📊' },
  { value: 'bar', label: 'Bar Chart', icon: '📊' },
  { value: 'line', label: 'Line Graph', icon: '📈' },
  { value: 'pie', label: 'Pie Chart', icon: '🥧' },
  { value: 'process', label: 'Process Diagram', icon: '⚙️' },
  { value: 'map', label: 'Map', icon: '🗺️' },
  { value: 'combo', label: 'Combo (e.g. line+bar)', icon: '🔀' },
];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = Object.fromEntries(QUESTION_TYPE_OPTIONS.map(({ value, label }) => [value, label])) as Record<QuestionType, string>;
