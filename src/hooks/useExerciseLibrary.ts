'use client';

import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { PREDEFINED_EXERCISES } from '@/lib/exerciseData';
import type { Exercise } from '@/types/exercise';
import { uuid } from '@/lib/utils';

export function useExerciseLibrary() {
  const [custom, setCustom] = useLocalStorage<Exercise[]>(STORAGE_KEYS.EXERCISES_CUSTOM, []);

  const allExercises = [...PREDEFINED_EXERCISES, ...custom];

  function addCustomExercise(data: Omit<Exercise, 'id' | 'isCustom' | 'createdAt'>) {
    const exercise: Exercise = {
      ...data,
      id: uuid(),
      isCustom: true,
      createdAt: new Date().toISOString(),
    };
    setCustom(prev => [...prev, exercise]);
    return exercise;
  }

  function deleteCustomExercise(id: string) {
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
