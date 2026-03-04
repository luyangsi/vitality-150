import type { MuscleGroup } from './exercise';

export interface SetLog {
  id: string;
  weight: number;        // kg
  reps: number;
  rpe?: number;          // 1–10
  isWarmup: boolean;
  completedAt: string;   // ISO 8601
  isPR?: boolean;
}

export interface ExerciseLog {
  id: string;
  exerciseId: string;
  exerciseName: string;
  sets: SetLog[];
  notes?: string;
}

export type SessionStatus = 'planned' | 'in_progress' | 'completed' | 'skipped';

export interface WorkoutSession {
  id: string;
  templateId?: string;
  name: string;
  date: string;              // YYYY-MM-DD
  startTime?: string;        // ISO 8601
  endTime?: string;          // ISO 8601
  durationMinutes?: number;
  status: SessionStatus;
  exercises: ExerciseLog[];
  notes?: string;
  perceivedExertion?: number;
  zone2MinutesLogged?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PRRecord {
  exerciseId: string;
  exerciseName: string;
  estimated1RM: number;
  weight: number;
  reps: number;
  date: string;
  sessionId: string;
}

export interface SessionSummary {
  sessionId: string;
  totalSets: number;
  totalReps: number;
  totalVolumeKg: number;
  muscleGroupsHit: MuscleGroup[];
  newPRs: PRRecord[];
  durationMinutes: number;
}
