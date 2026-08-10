import type { AppData } from '../types';

export function exportToJSON(data: AppData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `ielts-tracker-${getDateString()}.json`);
}

export function exportToCSV(data: AppData): void {
  const lines: string[] = [];

  lines.push('=== DAILY LOGS ===');
  lines.push('Date,Task Type,Task Description,Completed,Study Minutes,Notes');
  for (const log of data.dailyLogs) {
    for (const task of log.tasks) {
      lines.push(
        `"${log.date}","${task.type}","${task.description}","${task.completed}","${log.studyMinutes}","${log.notes}"`
      );
    }
  }

  lines.push('');
  lines.push('=== PROBLEMS ===');
  lines.push('Date Added,Category,Title,Description,Example,Solved,Topics');
  for (const p of data.problems) {
    lines.push(
      `"${p.dateAdded}","${p.category}","${p.title}","${p.description}","${p.example}","${p.solved}","${p.topics.join('; ')}"`
    );
  }

  lines.push('');
  lines.push('=== COLLOCATIONS ===');
  lines.push('Date Added,Phrase,Meaning,Usage,Context,Mastered,Topics');
  for (const c of data.collocations) {
    lines.push(
      `"${c.dateAdded}","${c.phrase}","${c.meaning}","${c.usage}","${c.context}","${c.mastered}","${c.topics.join('; ')}"`
    );
  }

  lines.push('');
  lines.push('=== STUDY SESSIONS ===');
  lines.push('Date,Duration (min),Category,Notes');
  for (const s of data.studySessions) {
    lines.push(`"${s.date}","${s.durationMinutes}","${s.category}","${s.notes}"`);
  }

  lines.push('');
  lines.push('=== ESSAYS ===');
  lines.push('Date Added,Topic,Question,Your Essay,Band 8-9 Essay,Band 5.5-6.5 Essay,Vocabulary,Topics');
  for (const e of data.essays) {
    lines.push(
      `"${e.dateAdded}","${e.topic}","${e.question}","${e.userEssay}","${e.highBandEssay}","${e.lowBandEssay}","${e.vocabulary.join('; ')}","${e.topics.join('; ')}"`
    );
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  downloadBlob(blob, `ielts-tracker-${getDateString()}.csv`);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function getDateString(): string {
  return new Date().toISOString().split('T')[0];
}
