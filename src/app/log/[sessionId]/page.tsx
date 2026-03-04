'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Check, Trophy, Timer, Trash2, X } from 'lucide-react';
import { useActiveSession } from '@/hooks/useActiveSession';
import { useWorkoutSessions } from '@/hooks/useWorkoutSessions';
import { useExerciseLibrary } from '@/hooks/useExerciseLibrary';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { cn, formatDuration } from '@/lib/utils';
import type { SetLog } from '@/types/session';

function SessionTimer({ startTime }: { startTime: string }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const tick = () => setElapsed(Math.floor((Date.now() - new Date(startTime).getTime()) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  return (
    <span className="font-mono text-vitality-500 text-sm">
      {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  );
}

function RestTimer({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    if (left <= 0) { onDone(); return; }
    const id = setTimeout(() => setLeft(l => l - 1), 1000);
    return () => clearTimeout(id);
  }, [left, onDone]);

  return (
    <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-1.5 text-xs text-blue-400">
      <Timer className="w-3.5 h-3.5" />
      Rest: <span className="font-mono font-bold">{left}s</span>
      <button onClick={onDone} className="ml-1 hover:text-blue-200"><X className="w-3 h-3" /></button>
    </div>
  );
}

export default function ActiveSessionPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter();
  const { session, addExerciseToSession, addSet, removeSet, updateNotes, finishSession, updateZone2Minutes } = useActiveSession();
  const { addSession } = useWorkoutSessions();
  const { searchExercises } = useExerciseLibrary();

  const [showExSearch, setShowExSearch] = useState(false);
  const [exQuery, setExQuery] = useState('');
  const [showFinish, setShowFinish] = useState(false);
  const [restingFor, setRestingFor] = useState<string | null>(null); // exerciseLogId
  const [zone2Minutes, setZone2Minutes] = useState(0);

  // New set defaults per exercise
  const [setInputs, setSetInputs] = useState<Record<string, { weight: string; reps: string; rpe: string; isWarmup: boolean }>>({});

  const getInput = (exLogId: string) => setInputs[exLogId] ?? { weight: '', reps: '', rpe: '', isWarmup: false };

  function updateInput(exLogId: string, field: string, value: string | boolean) {
    setSetInputs(prev => ({ ...prev, [exLogId]: { ...getInput(exLogId), [field]: value } }));
  }

  function logSet(exLogId: string) {
    const input = getInput(exLogId);
    const weight = parseFloat(input.weight) || 0;
    const reps = parseInt(input.reps) || 0;
    if (reps === 0) return;
    addSet(exLogId, {
      weight,
      reps,
      rpe: input.rpe ? parseInt(input.rpe) : undefined,
      isWarmup: input.isWarmup,
    });
    setRestingFor(exLogId);
  }

  function handleFinish() {
    const completed = finishSession();
    if (completed) {
      addSession(completed);
      router.push('/history');
    }
  }

  const searchResults = exQuery.length > 1 ? searchExercises(exQuery).slice(0, 8) : [];

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-4">
        <p className="text-slate-400">No active session found.</p>
        <Button onClick={() => router.push('/log')}>Go to Log</Button>
      </div>
    );
  }

  const totalVolume = session.exercises.flatMap(e => e.sets.filter(s => !s.isWarmup)).reduce((sum, s) => sum + s.weight * s.reps, 0);
  const totalSets = session.exercises.flatMap(e => e.sets.filter(s => !s.isWarmup)).length;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Session header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100">{session.name}</h1>
          <div className="flex items-center gap-4 mt-1">
            {session.startTime && <SessionTimer startTime={session.startTime} />}
            <span className="text-xs text-slate-500">{totalSets} sets · {Math.round(totalVolume)} kg volume</span>
          </div>
        </div>
        <Button onClick={() => setShowFinish(true)}>Finish</Button>
      </div>

      {/* Rest timer */}
      {restingFor && (
        <div className="mb-4">
          <RestTimer seconds={90} onDone={() => setRestingFor(null)} />
        </div>
      )}

      {/* Exercise blocks */}
      <div className="space-y-4">
        {session.exercises.map(exLog => (
          <div key={exLog.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <h3 className="font-semibold text-slate-100 mb-3">{exLog.exerciseName}</h3>

            {/* Set list */}
            {exLog.sets.length > 0 && (
              <div className="mb-3">
                <div className="grid grid-cols-5 gap-2 text-xs text-slate-500 mb-1 px-1">
                  <span>SET</span><span>WEIGHT</span><span>REPS</span><span>RPE</span><span></span>
                </div>
                {exLog.sets.map((set, idx) => (
                  <div key={set.id} className={cn(
                    'grid grid-cols-5 gap-2 items-center py-1.5 px-1 rounded text-sm',
                    set.isWarmup ? 'text-slate-500' : 'text-slate-200',
                    set.isPR && 'bg-amber-500/5'
                  )}>
                    <span className="font-mono text-xs">
                      {set.isWarmup ? 'W' : idx + 1}
                      {set.isPR && <Trophy className="w-3 h-3 text-amber-400 inline ml-1" />}
                    </span>
                    <span className="font-mono">{set.weight}kg</span>
                    <span className="font-mono">{set.reps}</span>
                    <span className="text-slate-500">{set.rpe ?? '–'}</span>
                    <button onClick={() => removeSet(exLog.id, set.id)} className="text-slate-600 hover:text-rose-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* New set input */}
            <div className="flex items-center gap-2 mt-2">
              <input
                type="number"
                placeholder="kg"
                value={getInput(exLog.id).weight}
                onChange={e => updateInput(exLog.id, 'weight', e.target.value)}
                className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-slate-100 text-center focus:outline-none focus:border-vitality-500"
              />
              <input
                type="number"
                placeholder="reps"
                value={getInput(exLog.id).reps}
                onChange={e => updateInput(exLog.id, 'reps', e.target.value)}
                className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-slate-100 text-center focus:outline-none focus:border-vitality-500"
              />
              <input
                type="number"
                placeholder="RPE"
                min="1" max="10"
                value={getInput(exLog.id).rpe}
                onChange={e => updateInput(exLog.id, 'rpe', e.target.value)}
                className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-slate-100 text-center focus:outline-none focus:border-vitality-500"
              />
              <label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer">
                <input type="checkbox" checked={getInput(exLog.id).isWarmup} onChange={e => updateInput(exLog.id, 'isWarmup', e.target.checked)} className="rounded" />
                W
              </label>
              <Button size="sm" onClick={() => logSet(exLog.id)}>
                <Check className="w-3.5 h-3.5" /> Log
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add exercise */}
      <div className="mt-4 relative">
        <Button variant="secondary" className="w-full" onClick={() => setShowExSearch(!showExSearch)}>
          <Plus className="w-4 h-4" /> Add Exercise
        </Button>
        {showExSearch && (
          <div className="mt-2 bg-slate-800 border border-slate-700 rounded-xl p-3">
            <input
              autoFocus
              type="text"
              placeholder="Search exercises..."
              value={exQuery}
              onChange={e => setExQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-vitality-500"
            />
            <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
              {searchResults.map(ex => (
                <button
                  key={ex.id}
                  onClick={() => { addExerciseToSession({ id: ex.id, name: ex.name }); setExQuery(''); setShowExSearch(false); }}
                  className="w-full text-left text-sm text-slate-300 hover:text-vitality-400 py-1.5 px-2 rounded hover:bg-slate-900"
                >
                  {ex.name} <span className="text-slate-500 text-xs">{ex.primaryMuscles[0]}</span>
                </button>
              ))}
              {exQuery.length > 0 && searchResults.length === 0 && (
                <p className="text-slate-500 text-xs text-center py-2">No results</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Finish modal */}
      <Modal open={showFinish} onClose={() => setShowFinish(false)} title="Finish Session">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-900 rounded-lg p-3">
              <p className="text-2xl font-mono font-bold text-vitality-500">{totalSets}</p>
              <p className="text-xs text-slate-400 mt-1">Total Sets</p>
            </div>
            <div className="bg-slate-900 rounded-lg p-3">
              <p className="text-2xl font-mono font-bold text-vitality-500">{Math.round(totalVolume)}</p>
              <p className="text-xs text-slate-400 mt-1">kg Volume</p>
            </div>
            <div className="bg-slate-900 rounded-lg p-3">
              <p className="text-2xl font-mono font-bold text-vitality-500">{session.exercises.length}</p>
              <p className="text-xs text-slate-400 mt-1">Exercises</p>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 uppercase tracking-wider">Zone 2 cardio included (min)</label>
            <input
              type="number"
              value={zone2Minutes}
              onChange={e => setZone2Minutes(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-vitality-500"
              placeholder="0"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowFinish(false)}>Cancel</Button>
            <Button onClick={handleFinish}>Save & Finish</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
