'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/AuthContext';
import type { WorkoutSession } from '@/types/session';
import { todayStr, uuid } from '@/lib/utils';

function rowToSession(row: Record<string, any>): WorkoutSession {
  return {
    id: row.id,
    templateId: row.template_id ?? undefined,
    name: row.name,
    date: String(row.date).slice(0, 10),
    startTime: row.start_time ?? undefined,
    endTime: row.end_time ?? undefined,
    durationMinutes: row.duration_minutes ?? undefined,
    status: row.status,
    exercises: row.exercises ?? [],
    notes: row.notes ?? undefined,
    perceivedExertion: row.perceived_exertion ?? undefined,
    zone2MinutesLogged: row.zone2_minutes_logged ?? undefined,
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useWorkoutSessions() {
  const { user } = useAuth();
  const supabase = createClient();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);

  useEffect(() => {
    if (!user) { setSessions([]); return; }
    supabase
      .from('workout_sessions')
      .select('*')
      .order('date', { ascending: false })
      .then(({ data }) => {
        if (data) setSessions(data.map(rowToSession));
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function addSession(session: WorkoutSession) {
    if (!user) return;
    const { data } = await supabase
      .from('workout_sessions')
      .insert({
        id: session.id,
        user_id: user.id,
        template_id: session.templateId ?? null,
        name: session.name,
        date: session.date,
        start_time: session.startTime ?? null,
        end_time: session.endTime ?? null,
        duration_minutes: session.durationMinutes ?? null,
        status: session.status,
        exercises: session.exercises,
        notes: session.notes ?? null,
        perceived_exertion: session.perceivedExertion ?? null,
        zone2_minutes_logged: session.zone2MinutesLogged ?? null,
        tags: session.tags,
        created_at: session.createdAt,
        updated_at: session.updatedAt,
      })
      .select()
      .single();
    if (data) setSessions(prev => [rowToSession(data), ...prev]);
  }

  async function updateSession(id: string, updates: Partial<WorkoutSession>) {
    const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.exercises !== undefined) dbUpdates.exercises = updates.exercises;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.perceivedExertion !== undefined) dbUpdates.perceived_exertion = updates.perceivedExertion;
    if (updates.zone2MinutesLogged !== undefined) dbUpdates.zone2_minutes_logged = updates.zone2MinutesLogged;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;

    const { data } = await supabase
      .from('workout_sessions')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    if (data) setSessions(prev => prev.map(s => s.id === id ? rowToSession(data) : s));
  }

  async function deleteSession(id: string) {
    await supabase.from('workout_sessions').delete().eq('id', id);
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
