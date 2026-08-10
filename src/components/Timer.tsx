import { useState, useEffect, useRef, useCallback } from 'react';
import { loadTimer, saveTimer, clearTimer } from '../utils/localStorage';

interface TimerProps {
  onSessionComplete: (minutes: number) => void;
}

export default function Timer({ onSessionComplete }: TimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const saved = loadTimer();
    setSeconds(saved.accumulatedSeconds);
    if (saved.isRunning) {
      setIsRunning(true);
    }
  }, []);

  useEffect(() => {
    if (isRunning) {
      saveTimer({ isRunning: true, startTimestamp: Date.now(), accumulatedSeconds: seconds });
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          const next = s + 1;
          saveTimer({ isRunning: true, startTimestamp: Date.now(), accumulatedSeconds: next });
          return next;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStop = useCallback(() => {
    setIsRunning(false);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      onSessionComplete(minutes);
    }
    clearTimer();
    setSeconds(0);
  }, [seconds, onSessionComplete]);

  const handleReset = () => {
    setIsRunning(false);
    clearTimer();
    setSeconds(0);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
      <h3 className="text-sm font-medium text-gray-500 mb-3">Study Timer</h3>
      <div className="text-5xl font-mono font-bold text-gray-800 mb-6">
        {formatTime(seconds)}
      </div>
      <div className="flex justify-center gap-3">
        {!isRunning ? (
          <button
            onClick={() => setIsRunning(true)}
            className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Start
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Stop & Save
          </button>
        )}
        <button
          onClick={handleReset}
          className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
