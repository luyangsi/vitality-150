'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/AuthContext';
import { PREDEFINED_EXERCISES } from '@/lib/exerciseData';
import type { Exercise } from '@/types/exercise';

function rowToExercise(row: Record<string, any>): Exercise {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    primaryMuscles: row.primary_muscles ?? [],
    secondaryMuscles: row.secondary_muscles ?? [],
    equipment: row.equipment,
    isCustom: true,
    instructions: row.instructions ?? undefined,
    createdAt: row.created_at,
  };
}

export function useExerciseLibrary() {
  const { user } = useAuth();
  const supabase = createClient();
  const [custom, setCustom] = useState<Exercise[]>([]);

  useEffect(() => {
    if (!user) { setCustom([]); return; }
    supabase
      .from('custom_exercises')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setCustom(data.map(rowToExercise));
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const allExercises = [...PREDEFINED_EXERCISES, ...custom];

  async function addCustomExercise(data: Omit<Exercise, 'id' | 'isCustom' | 'createdAt'>): Promise<Exercise> {
    if (!user) throw new Error('Not authenticated');
    const { data: row } = await supabase
      .from('custom_exercises')
      .insert({
        user_id: user.id,
        name: data.name,
        category: data.category,
        primary_muscles: data.primaryMuscles,
        secondary_muscles: data.secondaryMuscles,
        equipment: data.equipment,
        instructions: data.instructions ?? null,
      })
      .select()
      .single();
    const exercise = rowToExercise(row!);
    setCustom(prev => [exercise, ...prev]);
    return exercise;
  }

  async function deleteCustomExercise(id: string) {
    await supabase.from('custom_exercises').delete().eq('id', id);
    setCustom(prev => prev.filter(e => e.id !== id));
  }

  function searchExercises(query: string): Exercise[] {
    const q = query.toLowerCase();
    return allExercises.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.primaryMuscles.some(m => m.includes(q)) ||
      e.category.includes(q)
    );
  }

  return { allExercises, predefined: PREDEFINED_EXERCISES, custom, addCustomExercise, deleteCustomExercise, searchExercises };
}
