'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/AuthContext';
import type { WorkoutTemplate } from '@/types/planner';
import { uuid } from '@/lib/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToTemplate(row: Record<string, any>): WorkoutTemplate {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    targetMuscleGroups: row.target_muscle_groups ?? [],
    estimatedDurationMinutes: row.estimated_duration_minutes,
    exercises: row.exercises ?? [],
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useTemplates() {
  const { user } = useAuth();
  const supabase = createClient();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);

  useEffect(() => {
    if (!user) { setTemplates([]); return; }
    supabase
      .from('workout_templates')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setTemplates(data.map(rowToTemplate));
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function addTemplate(data: Omit<WorkoutTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkoutTemplate> {
    const now = new Date().toISOString();
    const id = uuid();
    const { data: row } = await supabase
      .from('workout_templates')
      .insert({
        id,
        user_id: user?.id,
        name: data.name,
        category: data.category,
        target_muscle_groups: data.targetMuscleGroups,
        estimated_duration_minutes: data.estimatedDurationMinutes,
        exercises: data.exercises,
        tags: data.tags,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();
    const template = row ? rowToTemplate(row) : { ...data, id, createdAt: now, updatedAt: now };
    setTemplates(prev => [template, ...prev]);
    return template;
  }

  async function updateTemplate(id: string, updates: Partial<WorkoutTemplate>) {
    const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.targetMuscleGroups !== undefined) dbUpdates.target_muscle_groups = updates.targetMuscleGroups;
    if (updates.estimatedDurationMinutes !== undefined) dbUpdates.estimated_duration_minutes = updates.estimatedDurationMinutes;
    if (updates.exercises !== undefined) dbUpdates.exercises = updates.exercises;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;

    const { data: row } = await supabase
      .from('workout_templates')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    if (row) setTemplates(prev => prev.map(t => t.id === id ? rowToTemplate(row) : t));
  }

  async function deleteTemplate(id: string) {
    await supabase.from('workout_templates').delete().eq('id', id);
    setTemplates(prev => prev.filter(t => t.id !== id));
  }

  function getTemplateById(id: string): WorkoutTemplate | undefined {
    return templates.find(t => t.id === id);
  }

  return { templates, addTemplate, updateTemplate, deleteTemplate, getTemplateById };
}
