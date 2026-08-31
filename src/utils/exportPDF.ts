import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { AppData } from '../types';

type PDFOptions = {
  includeVocab: boolean;
  includeSchedule: boolean;
  includeProblems: boolean;
  topics: string[];
};

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b] as [number, number, number];
}

export function exportToPDF(data: AppData, opts: PDFOptions) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;
  let y = 14;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...hexToRgb('#1e40af'));
  doc.text('IELTS Prep Tracker', margin, y);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...hexToRgb('#6b7280'));
  doc.text(`Generated: ${new Date().toISOString().split('T')[0]}  |  Vocab: ${data.collocations.length}  |  Study: ${data.studySessions.length} sessions`, margin, y + 6);
  y += 12;

  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  if (opts.includeSchedule && data.studySessions.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...hexToRgb('#1f2937'));
    doc.text('Schedule / Study Sessions', margin, y);
    y += 4;
    const rows = [...data.studySessions]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((s) => [s.date, s.testName || '-', s.category, s.notes || '-', `${s.durationMinutes} min`]);
    autoTable(doc, {
      startY: y,
      head: [['Date', 'Test', 'Category', 'Score / Note', 'Duration']],
      body: rows,
      margin: { left: margin, right: margin },
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: hexToRgb('#1e40af'), textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: hexToRgb('#eff6ff') },
      columnStyles: { 0: { cellWidth: 24 }, 1: { cellWidth: 42 }, 2: { cellWidth: 24 }, 4: { cellWidth: 18 } },
    });
    // @ts-ignore
    y = (doc as any).lastAutoTable.finalY + 8;
    if (y > 270) { doc.addPage(); y = 14; }
  }

  if (opts.includeVocab) {
    const filtered = opts.topics.length > 0 ? data.collocations.filter((c) => c.topics.some((t) => opts.topics.includes(t))) : data.collocations;
    const byTopic = new Map<string, typeof filtered>();
    for (const c of filtered) {
      const key = (c.topics[0] || 'Uncategorized').toLowerCase();
      const display = c.topics[0] || 'Uncategorized';
      if (!byTopic.has(display)) byTopic.set(display, []);
      byTopic.get(display)!.push(c);
    }
    const sortedTopics = Array.from(byTopic.keys()).sort((a, b) => a.localeCompare(b));
    if (sortedTopics.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(...hexToRgb('#9ca3af'));
      doc.text('No vocabulary for selected topics.', margin, y);
      y += 6;
    } else {
      for (const topic of sortedTopics) {
        const cols = byTopic.get(topic)!;
        if (y > 240) { doc.addPage(); y = 14; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...hexToRgb('#7c3aed'));
        doc.text(`${topic}  (${cols.length})`, margin, y);
        y += 3;
        const body = cols.map((c) => {
          const usage: string[] = [];
          if (c.writingTask1Example) usage.push(`W1: ${c.writingTask1Example}`);
          if (c.writingTask2Example) usage.push(`W2: ${c.writingTask2Example}`);
          if (c.speakingExample) usage.push(`Sp: ${c.speakingExample}`);
          const usageStr = usage.length ? usage.join('\n') : '-';
          const defWithUsage = usage.length ? `${c.definition || '-'}${c.definition ? '\n' : ''}${usageStr}` : (c.definition || '-');
          return [
            c.phrase,
            defWithUsage,
            (c.synonyms || []).join(', ') || '-',
            (c.antonyms || []).join(', ') || '-',
            c.note || '-',
          ];
        });
        autoTable(doc, {
          startY: y,
          head: [['Phrase', 'Definition + Usage (W1/W2/Sp)', 'Synonyms', 'Antonyms', 'Note']],
          body,
          margin: { left: margin, right: margin },
          styles: { fontSize: 6.5, cellPadding: 1.8, overflow: 'linebreak' },
          headStyles: { fillColor: hexToRgb('#7c3aed'), textColor: 255, fontStyle: 'bold', fontSize: 7 },
          alternateRowStyles: { fillColor: hexToRgb('#f5f3ff') },
          columnStyles: { 0: { cellWidth: 30 }, 1: { cellWidth: 60 }, 2: { cellWidth: 32 }, 3: { cellWidth: 30 }, 4: { cellWidth: 26 } },
        });
        // @ts-ignore
        y = (doc as any).lastAutoTable.finalY + 7;
        if (y > 270) { doc.addPage(); y = 14; }
      }
    }
  }

  if (opts.includeProblems && data.problems.length > 0) {
    if (y > 240) { doc.addPage(); y = 14; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...hexToRgb('#1f2937'));
    doc.text('Problems / Mistakes', margin, y);
    y += 4;
    const rows = data.problems.slice(0, 80).map((p) => [p.dateAdded, p.category, p.title, p.topics.join(', ')]);
    autoTable(doc, {
      startY: y,
      head: [['Date', 'Category', 'Title', 'Topics']],
      body: rows,
      margin: { left: margin, right: margin },
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: hexToRgb('#dc2626'), textColor: 255 },
      alternateRowStyles: { fillColor: hexToRgb('#fef2f2') },
    });
  }

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(`Page ${i} / ${total}`, pageWidth - margin - 18, 290);
  }

  doc.save(`ielts-tracker-${new Date().toISOString().split('T')[0]}.pdf`);
}
