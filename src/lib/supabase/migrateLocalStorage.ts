import type { SupabaseClient } from '@supabase/supabase-js';
import { getItem } from '@/lib/storage/store';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import type { WorkoutSession } from '@/types/session';
import type { WorkoutTemplate, WeeklyPlan } from '@/types/planner';
import type { LongevityState } from '@/types/longevity';
import type { Exercise } from '@/types/exercise';

export async function migrateLocalStorageToSupabase(
  supabase: SupabaseClient,
  userId: string
): Promise<{ imported: number; errors: string[] }> {
  const errors: string[] = [];
  let imported = 0;

  // Sessions
  const sessions = getItem<WorkoutSession[]>(STORAGE_KEYS.SESSIONS, []);
  if (sessions.length > 0) {
    const rows = sessions.map(s => ({
      id: s.id, user_id: userId,
      template_id: s.templateId ?? null, name: s.name, date: s.date,
      start_time: s.startTime ?? null, end_time: s.endTime ?? null,
      duration_minutes: s.durationMinutes ?? null, status: s.status,
      exercises: s.exercises, notes: s.notes ?? null,
      perceived_exertion: s.perceivedExertion ?? null,
      zone2_minutes_logged: s.zone2MinutesLogged ?? null,
      tags: s.tags, created_at: s.createdAt, updated_at: s.updatedAt,
    }));
    const { error } = await supabase.from('workout_sessions').upsert(rows, { onConflict: 'id' });
    if (error) errors.push(`Sessions: ${error.message}`);
    else imported += rows.length;
  }

  // Templates
  const templates = getItem<WorkoutTemplate[]>(STORAGE_KEYS.TEMPLATES, []);
  if (templates.length > 0) {
    const rows = templates.map(t => ({
      id: t.id, user_id: userId, name: t.name, category: t.category,
      target_muscle_groups: t.targetMuscleGroups,
      estimated_duration_minutes: t.estimatedDurationMinutes,
      exercises: t.exercises, tags: t.tags,
      created_at: t.createdAt, updated_at: t.updatedAt,
    }));
    const { error } = await supabase.from('workout_templates').upsert(rows, { onConflict: 'id' });
    if (error) errors.push(`Templates: ${error.message}`);
    else imported += rows.length;
  }

  // Weekly plans
  const plans = getItem<WeeklyPlan[]>(STORAGE_KEYS.WEEKLY_PLANS, []);
  if (plans.length > 0) {
    const rows = plans.map(p => ({
      user_id: userId, week_start_date: p.weekStartDate, days: p.days,
      created_at: p.createdAt, updated_at: p.updatedAt,
    }));
    const { error } = await supabase.from('weekly_plans').upsert(rows, { onConflict: 'user_id,week_start_date' });
    if (error) errors.push(`Weekly plans: ${error.message}`);
    else imported += rows.length;
  }

  // Longevity data
  const longevity = getItem<LongevityState | null>(STORAGE_KEYS.LONGEVITY, null);
  if (longevity) {
    const p = longevity.profile;
    await supabase.from('profiles').upsert({
      id: userId, name: p.name, birth_year: p.birthYear, gender: p.gender,
      bodyweight_kg: p.bodyweightKg, height_cm: p.heightCm,
      max_heart_rate: p.maxHeartRate ?? null, zone2_hr_floor: p.zone2HrFloor ?? null,
      zone2_hr_ceiling: p.zone2HrCeiling ?? null, weight_unit: p.weightUnit,
      zone2_weekly_target_minutes: p.zone2WeeklyTargetMinutes,
      onboarding_complete: p.onboardingComplete,
    }, { onConflict: 'id' });

    if (longevity.dailyLogs.length > 0) {
      const rows = longevity.dailyLogs.map(l => ({
        user_id: userId, date: l.date, hrv: l.hrv ?? null, zone2: l.zone2 ?? null,
        mobility_score: l.mobilityScore ?? null, sleep_hours: l.sleepHours ?? null,
        sleep_quality: l.sleepQuality ?? null, stress_level: l.stressLevel ?? null,
        alcohol_units: l.alcoholUnits ?? null, notes: l.notes ?? null,
      }));
      const { error } = await supabase.from('daily_longevity_logs').upsert(rows, { onConflict: 'user_id,date' });
      if (error) errors.push(`Daily logs: ${error.message}`);
      else imported += rows.length;
    }

    if (longevity.vo2MaxHistory.length > 0) {
      const rows = longevity.vo2MaxHistory.map(v => ({
        user_id: userId, date: v.date, estimated_vo2_max: v.estimatedVO2Max,
        test_method: v.testMethod, notes: v.notes ?? null,
      }));
      await supabase.from('vo2max_history').insert(rows);
      imported += rows.length;
    }

    if (longevity.mobilityHistory.length > 0) {
      const rows = longevity.mobilityHistory.map(m => ({
        user_id: userId, date: m.date, overall_score: m.overallScore, components: m.components,
      }));
      await supabase.from('mobility_history').insert(rows);
      imported += rows.length;
    }

    if (longevity.strengthBenchmarks.length > 0) {
      const rows = longevity.strengthBenchmarks.map(s => ({
        user_id: userId, date: s.date, bodyweight_kg: s.bodyweightKg,
        grip_strength_kg: s.gripStrengthKg ?? null, leg_press_ratio: s.legPressRatio ?? null,
        deadlift_ratio: s.deadliftRatio ?? null, push_up_count: s.pushUpCount ?? null,
        pull_up_count: s.pullUpCount ?? null,
      }));
      await supabase.from('strength_benchmarks').insert(rows);
      imported += rows.length;
    }
  }

  // Custom exercises
  const customExercises = getItem<Exercise[]>(STORAGE_KEYS.EXERCISES_CUSTOM, []);
  if (customExercises.length > 0) {
    const rows = customExercises.map(e => ({
      user_id: userId, name: e.name, category: e.category,
      primary_muscles: e.primaryMuscles, secondary_muscles: e.secondaryMuscles,
      equipment: e.equipment, instructions: e.instructions ?? null,
      created_at: e.createdAt,
    }));
    const { error } = await supabase.from('custom_exercises').insert(rows);
    if (error) errors.push(`Custom exercises: ${error.message}`);
    else imported += rows.length;
  }

  return { imported, errors };
}

export function localStorageDataExists(): boolean {
  const sessions = getItem<unknown[]>(STORAGE_KEYS.SESSIONS, []);
  const templates = getItem<unknown[]>(STORAGE_KEYS.TEMPLATES, []);
  return sessions.length > 0 || templates.length > 0;
}
