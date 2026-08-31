import { useState, useEffect, useMemo } from 'react';
import { loadDataAsync } from '../utils/localStorage';
import type { AppData, StudySession } from '../types';

const EMPTY: AppData = { dailyLogs: [], problems: [], collocations: [], studySessions: [], essays: [], writingMistakes: [] };

function calculateBand(score: number, total: number): number {
  // IELTS Academic Listening/Reading conversion (official)
  if (score >= 39) return 9.0;
  if (score >= 37) return 8.5;
  if (score >= 35) return 8.0;
  if (score >= 33) return 7.5;
  if (score >= 30) return 7.0;
  if (score >= 27) return 6.5;
  if (score >= 23) return 6.0;
  if (score >= 19) return 5.5;
  if (score >= 15) return 5.0;
  if (score >= 13) return 4.5;
  if (score >= 10) return 4.0;
  if (score >= 8) return 3.5;
  if (score >= 6) return 3.0;
  if (score >= 4) return 2.5;
  if (score >= 3) return 2.0;
  if (score >= 2) return 1.5;
  if (score >= 1) return 1.0;
  return 0.0;
}

// IELTS Official Overall Band Score Rounding
// "If the average ends in .25, round UP to next half band"
// "If the average ends in .75, round UP to next whole band"
function roundToIELTSBand(avg: number): number {
  const floor = Math.floor(avg * 2) / 2;
  const remainder = avg - floor;
  if (remainder >= 0.75) return floor + 1.0;
  if (remainder >= 0.25) return floor + 0.5;
  return floor;
}

function extractScore(notes: string): { score: number; total: number } | null {
  const match = notes?.match(/(\d+)\/40/);
  if (match) {
    return { score: parseInt(match[1]), total: 40 };
  }
  return null;
}

function SessionRow({ session, type }: { session: StudySession; type: 'listening' | 'reading' }) {
  const extracted = extractScore(session.notes);
  const band = extracted ? calculateBand(extracted.score, extracted.total) : 0;
  const testName = session.testName || session.notes?.split(':')[0] || 'Unknown Test';
  return (
    <div className="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-gray-800 font-medium">{testName}</span>
        <span className="text-gray-400 text-xs">{session.date}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-600">{extracted?.score}/40</span>
        <span className={`font-bold ${band >= 7 ? 'text-green-600' : band >= 6 ? 'text-yellow-600' : 'text-red-600'}`}>
          Band {band}
        </span>
      </div>
    </div>
  );
}

export default function BandScore() {
  const [data, setData] = useState<AppData>(EMPTY);
  const [target] = useState(7.5);

  useEffect(() => {
    loadDataAsync().then(setData);
  }, []);

  const readingSessions = useMemo(() =>
    data.studySessions
      .filter(s => s.category === 'reading' && (s.notes?.includes('Cambridge') || s.testName))
      .sort((a, b) => b.date.localeCompare(a.date)),
    [data.studySessions]
  );

  const listeningSessions = useMemo(() =>
    data.studySessions
      .filter(s => s.category === 'listening' && (s.notes?.includes('Cambridge') || s.testName))
      .sort((a, b) => b.date.localeCompare(a.date)),
    [data.studySessions]
  );

  // Calculate ALL bands for each skill
  const allReadingBands = useMemo(() =>
    readingSessions
      .map(s => extractScore(s.notes))
      .filter(Boolean)
      .map(s => calculateBand(s!.score, s!.total)),
    [readingSessions]
  );

  const allListeningBands = useMemo(() =>
    listeningSessions
      .map(s => extractScore(s.notes))
      .filter(Boolean)
      .map(s => calculateBand(s!.score, s!.total)),
    [listeningSessions]
  );

  // Average and Best for each skill
  const readingBest = allReadingBands.length > 0 ? Math.max(...allReadingBands) : 0;
  const readingAverage = allReadingBands.length > 0
    ? Math.round((allReadingBands.reduce((a, b) => a + b, 0) / allReadingBands.length) * 2) / 2
    : 0;
  const listeningBest = allListeningBands.length > 0 ? Math.max(...allListeningBands) : 0;
  const listeningAverage = allListeningBands.length > 0
    ? Math.round((allListeningBands.reduce((a, b) => a + b, 0) / allListeningBands.length) * 2) / 2
    : 0;

  const writingBand = 5.5;
  const speakingBand = 6.0;

  // Overall using BEST scores (IELTS official rounding)
  const bestScores = [readingBest, listeningBest, writingBand, speakingBand].filter(s => s > 0);
  const overallBest = bestScores.length > 0
    ? roundToIELTSBand(bestScores.reduce((a, b) => a + b, 0) / bestScores.length)
    : 0;

  // Overall using AVERAGE scores (IELTS official rounding)
  const avgScores = [readingAverage, listeningAverage, writingBand, speakingBand].filter(s => s > 0);
  const overallAverage = avgScores.length > 0
    ? roundToIELTSBand(avgScores.reduce((a, b) => a + b, 0) / avgScores.length)
    : 0;

  const gap = target - overallBest;

  // Trend calculation
  const getTrend = (bands: number[]): 'up' | 'down' | 'stable' => {
    if (bands.length < 2) return 'stable';
    const recent = bands[0];
    const previous = bands[1];
    if (recent > previous) return 'up';
    if (recent < previous) return 'down';
    return 'stable';
  };

  const readingTrend = getTrend(allReadingBands);
  const listeningTrend = getTrend(allListeningBands);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Band Score Tracker</h1>
        <p className="text-gray-500 mt-1">Track your IELTS progress toward Band 7.5</p>
      </div>

      {/* Overall Score - Best */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-indigo-100">Overall Band Score (Best)</p>
            <p className="text-5xl font-bold">{overallBest}</p>
            <p className="text-indigo-200 mt-1">Average: {overallAverage}</p>
          </div>
          <div className="text-right">
            <p className="text-indigo-100">Target</p>
            <p className="text-3xl font-bold">{target}</p>
            <p className="text-indigo-200 mt-1">{gap > 0 ? `${gap.toFixed(1)} bands to go` : 'Target achieved!'}</p>
          </div>
        </div>
      </div>

      {/* Skill Scores - Best vs Average */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Listening */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Listening</h3>
            <div className="flex items-center gap-2">
              {listeningTrend === 'up' && <span className="text-green-500 text-lg">↑</span>}
              {listeningTrend === 'down' && <span className="text-red-500 text-lg">↓</span>}
              <span className={`text-2xl font-bold ${listeningBest >= 7 ? 'text-green-600' : listeningBest >= 6 ? 'text-yellow-600' : 'text-red-600'}`}>
                {listeningBest > 0 ? listeningBest : '—'}
              </span>
            </div>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Best:</span>
              <span className="font-medium">{listeningBest > 0 ? `Band ${listeningBest}` : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Average:</span>
              <span className="font-medium">{listeningAverage > 0 ? `Band ${listeningAverage}` : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tests:</span>
              <span className="font-medium">{listeningSessions.length}</span>
            </div>
          </div>
          <div className="mt-3 bg-gray-200 rounded-full h-2">
            <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${(listeningBest / 9) * 100}%` }} />
          </div>
        </div>

        {/* Reading */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Reading</h3>
            <div className="flex items-center gap-2">
              {readingTrend === 'up' && <span className="text-green-500 text-lg">↑</span>}
              {readingTrend === 'down' && <span className="text-red-500 text-lg">↓</span>}
              <span className={`text-2xl font-bold ${readingBest >= 7 ? 'text-green-600' : readingBest >= 6 ? 'text-yellow-600' : 'text-red-600'}`}>
                {readingBest > 0 ? readingBest : '—'}
              </span>
            </div>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Best:</span>
              <span className="font-medium">{readingBest > 0 ? `Band ${readingBest}` : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Average:</span>
              <span className="font-medium">{readingAverage > 0 ? `Band ${readingAverage}` : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tests:</span>
              <span className="font-medium">{readingSessions.length}</span>
            </div>
          </div>
          <div className="mt-3 bg-gray-200 rounded-full h-2">
            <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${(readingBest / 9) * 100}%` }} />
          </div>
        </div>

        {/* Writing */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Writing</h3>
            <span className={`text-2xl font-bold ${writingBand >= 7 ? 'text-green-600' : writingBand >= 6 ? 'text-yellow-600' : 'text-red-600'}`}>
              {writingBand}
            </span>
          </div>
          <p className="text-sm text-gray-500">Estimated from essays</p>
          <div className="mt-3 bg-gray-200 rounded-full h-2">
            <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${(writingBand / 9) * 100}%` }} />
          </div>
        </div>

        {/* Speaking */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Speaking</h3>
            <span className={`text-2xl font-bold ${speakingBand >= 7 ? 'text-green-600' : speakingBand >= 6 ? 'text-yellow-600' : 'text-red-600'}`}>
              {speakingBand}
            </span>
          </div>
          <p className="text-sm text-gray-500">Assessed in lesson</p>
          <div className="mt-3 bg-gray-200 rounded-full h-2">
            <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${(speakingBand / 9) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Score History with Test Names */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Score History</h3>
        
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-2">Listening ({listeningSessions.length} tests)</h4>
            {listeningSessions.length === 0 ? (
              <p className="text-sm text-gray-400">No tests taken yet</p>
            ) : (
              <div>
                {listeningSessions.map(s => (
                  <SessionRow key={s.id} session={s} type="listening" />
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-2">Reading ({readingSessions.length} tests)</h4>
            {readingSessions.length === 0 ? (
              <p className="text-sm text-gray-400">No tests taken yet</p>
            ) : (
              <div>
                {readingSessions.map(s => (
                  <SessionRow key={s.id} session={s} type="reading" />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* IELTS Conversion Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">IELTS Band Score Conversion</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
          <div className="bg-gray-50 p-2 rounded text-center">
            <div className="font-bold">9.0</div>
            <div className="text-gray-500">39-40</div>
          </div>
          <div className="bg-gray-50 p-2 rounded text-center">
            <div className="font-bold">8.5</div>
            <div className="text-gray-500">37-38</div>
          </div>
          <div className="bg-gray-50 p-2 rounded text-center">
            <div className="font-bold">8.0</div>
            <div className="text-gray-500">35-36</div>
          </div>
          <div className="bg-green-50 p-2 rounded text-center border border-green-200">
            <div className="font-bold text-green-700">7.5</div>
            <div className="text-green-600">33-34</div>
          </div>
          <div className="bg-green-50 p-2 rounded text-center border border-green-200">
            <div className="font-bold text-green-700">7.0</div>
            <div className="text-green-600">30-32</div>
          </div>
          <div className="bg-yellow-50 p-2 rounded text-center">
            <div className="font-bold">6.5</div>
            <div className="text-gray-500">27-29</div>
          </div>
          <div className="bg-yellow-50 p-2 rounded text-center">
            <div className="font-bold">6.0</div>
            <div className="text-gray-500">23-26</div>
          </div>
          <div className="bg-orange-50 p-2 rounded text-center">
            <div className="font-bold">5.5</div>
            <div className="text-gray-500">19-22</div>
          </div>
          <div className="bg-orange-50 p-2 rounded text-center">
            <div className="font-bold">5.0</div>
            <div className="text-gray-500">15-18</div>
          </div>
          <div className="bg-red-50 p-2 rounded text-center">
            <div className="font-bold">4.5</div>
            <div className="text-gray-500">13-14</div>
          </div>
        </div>
      </div>
    </div>
  );
}
