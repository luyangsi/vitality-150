'use client';

import { useCallback, useState, useEffect } from 'react';
import { getItem, setItem, removeItem } from '@/lib/storage/store';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import type { WorkoutSession, ExerciseLog, SetLog } from '@/types/session';
import { uuid } from '@/lib/utils';
import { estimatedOneRepMax } from '@/lib/calculations/oneRepMax';

export function useActiveSession() {
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSession(getItem<WorkoutSession | null>(STORAGE_KEYS.ACTIVE_SESSION, null));
    setHydrated(true);
  }, []);

  const update = useCallback((updater: (s: WorkoutSession) => WorkoutSession) => {
    setSession(prev => {
      if (!prev) return prev;
      const next = updater(prev);
      setItem(STORAGE_KEYS.ACTIVE_SESSION, next);
      return next;
    });
  }, []);

  function startSession(s: WorkoutSession) {
    setItem(STORAGE_KEYS.ACTIVE_SESSION, s);
    setSession(s);
  }

  function addExerciseToSession(ex: { id: string; name: string }) {
    const log: ExerciseLog = { id: uuid(), exerciseId: ex.id, exerciseName: ex.name, sets: [] };
    update(s => ({ ...s, exercises: [...s.exercises, log], updatedAt: new Date().toISOString() }));
  }

  function addSet(exerciseLogId: string, setData: Omit<SetLog, 'id' | 'completedAt' | 'isPR'>) {
    update(s => {
      const exercises = s.exercises.map(e => {
        if (e.id !== exerciseLogId) return e;
        // PR detection
        const current1RM = estimatedOneRepMax(setData.weight, setData.reps);
        const bestPrev = e.sets.reduce((best, st) => {
          const rm = estimatedOneRepMax(st.weight, st.reps);
          return rm > best ? rm : best;
        }, 0);
        const isPR = current1RM > bestPrev && bestPrev > 0;
        const newSet: SetLog = { ...setData, id: uuid(), completedAt: new Date().toISOString(), isPR };
        return { ...e, sets: [...e.sets, newSet] };
      });
      return { ...s, exercises, updatedAt: new Date().toISOString() };
    });
  }

  function updateSet(exerciseLogId: string, setId: string, updates: Partial<SetLog>) {
    update(s => ({
      ...s,
      exercises: s.exercises.map(e =>
        e.id === exerciseLogId
          ? { ...e, sets: e.sets.map(st => st.id === setId ? { ...st, ...updates } : st) }
          : e
      ),
      updatedAt: new Date().toISOString(),
    }));
  }

  function removeSet(exerciseLogId: string, setId: string) {
    update(s => ({
      ...s,
      exercises: s.exercises.map(e =>
        e.id === exerciseLogId
          ? { ...e, sets: e.sets.filter(st => st.id !== setId) }
          : e
      ),
      updatedAt: new Date().toISOString(),
    }));
  }

  function updateNotes(notes: string) {
    update(s => ({ ...s, notes, updatedAt: new Date().toISOString() }));
  }

  function updateZone2Minutes(minutes: number) {
    update(s => ({ ...s, zone2MinutesLogged: minutes, updatedAt: new Date().toISOString() }));
  }

  function finishSession(): WorkoutSession | null {
    if (!session) return null;
    const endTime = new Date().toISOString();
    const startMs = session.startTime ? new Date(session.startTime).getTime() : Date.now();
    const durationMinutes = Math.round((Date.now() - startMs) / 60000);
    const completed: WorkoutSession = {
      ...session,
      endTime,
      durationMinutes,
      status: 'completed',
      updatedAt: endTime,
    };
    removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    setSession(null);
    return completed;
  }

  function discardSession() {
    removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    setSession(null);
  }

  return { session, hydrated, startSession, addExerciseToSession, addSet, updateSet, removeSet, updateNotes, updateZone2Minutes, finishSession, discardSession };
}
