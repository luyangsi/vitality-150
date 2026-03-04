'use client';

import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import type { WorkoutSession } from '@/types/session';
import { todayStr, uuid } from '@/lib/utils';

export function useWorkoutSessions() {
  const [sessions, setSessions] = useLocalStorage<WorkoutSession[]>(STORAGE_KEYS.SESSIONS, []);

  function addSession(session: WorkoutSession) {
    setSessions(prev => [session, ...prev]);
  }

  function updateSession(id: string, updates: Partial<WorkoutSession>) {
    setSessions(prev =>
      prev.map(s => s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s)
    );
  }

  function deleteSession(id: string) {
    setSessions(prev => prev.filter(s => s.id !== id));
  }

  function getSessionsByDate(date: string): WorkoutSession[] {
    return sessions.filter(s => s.date === date);
  }

  function getSessionsInRange(start: string, end: string): WorkoutSession[] {
    return sessions.filter(s => s.date >= start && s.date <= end);
  }

  function createNewSession(name: string, templateId?: string): WorkoutSession {
    return {
      id: uuid(),
      name,
      templateId,
      date: todayStr(),
      startTime: new Date().toISOString(),
      status: 'in_progress',
      exercises: [],
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  return { sessions, addSession, updateSession, deleteSession, getSessionsByDate, getSessionsInRange, createNewSession };
}
