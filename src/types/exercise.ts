export type MuscleGroup =
  | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps'
  | 'forearms' | 'core' | 'glutes' | 'quads' | 'hamstrings'
  | 'calves' | 'full_body';

export type ExerciseCategory =
  | 'strength' | 'cardio' | 'mobility' | 'plyometric' | 'isometric';

export type EquipmentType =
  | 'barbell' | 'dumbbell' | 'cable' | 'machine'
  | 'bodyweight' | 'kettlebell' | 'bands' | 'none';

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  equipment: EquipmentType;
  isCustom: boolean;
  instructions?: string;
  createdAt: string;
}

export const MUSCLE_GROUP_COLORS: Record<MuscleGroup, string> = {
  chest:     '#f97316',
  back:      '#3b82f6',
  shoulders: '#a855f7',
  biceps:    '#ec4899',
  triceps:   '#f43f5e',
  forearms:  '#fb923c',
  core:      '#eab308',
  glutes:    '#00d4aa',
  quads:     '#22c55e',
  hamstrings:'#14b8a6',
  calves:    '#06b6d4',
  full_body: '#8b5cf6',
};
