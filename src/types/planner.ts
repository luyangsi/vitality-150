import type { ExerciseCategory, MuscleGroup } from './exercise';

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sunday

export interface PlannedExercise {
  exerciseId: string;
  exerciseName: string;
  targetSets: number;
  targetReps: string;      // e.g. "8-12" or "5"
  targetWeightKg?: number;
  notes?: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  category: ExerciseCategory;
  targetMuscleGroups: MuscleGroup[];
  estimatedDurationMinutes: number;
  exercises: PlannedExercise[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DayPlan {
  dayOfWeek: DayOfWeek;
  templateIds: string[];
  isRestDay: boolean;
  notes?: string;
}

export interface WeeklyPlan {
  id: string;
  weekStartDate: string;   // Monday YYYY-MM-DD
  days: DayPlan[];
  createdAt: string;
  updatedAt: string;
}
