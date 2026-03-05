'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/AuthContext';
import type {
  LongevityState, DailyLongevityLog, VO2MaxEntry,
  MobilityAssessment, StrengthBenchmark, UserProfile,
} from '@/types/longevity';
import { todayStr } from '@/lib/utils';

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  birthYear: 1990,
  gender: 'male',
  bodyweightKg: 75,
  heightCm: 175,
  weightUnit: 'kg',
  zone2WeeklyTargetMinutes: 180,
  onboardingComplete: false,
  createdAt: new Date().toISOString(),
};

const DEFAULT_STATE: LongevityState = {
  dailyLogs: [],
  vo2MaxHistory: [],
  mobilityHistory: [],
  strengthBenchmarks: [],
  profile: DEFAULT_PROFILE,
};

function rowToProfile(row: Record<string, any>): UserProfile {
  return {
    name: row.name || '',
    birthYear: row.birth_year || 1990,
    gender: row.gender || 'male',
    bodyweightKg: row.bodyweight_kg || 75,
    heightCm: row.height_cm || 175,
    maxHeartRate: row.max_heart_rate ?? undefined,
    zone2HrFloor: row.zone2_hr_floor ?? undefined,
    zone2HrCeiling: row.zone2_hr_ceiling ?? undefined,
    weightUnit: row.weight_unit || 'kg',
    zone2WeeklyTargetMinutes: row.zone2_weekly_target_minutes || 180,
    onboardingComplete: row.onboarding_complete || false,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function rowToDailyLog(row: Record<string, any>): DailyLongevityLog {
  return {
    date: String(row.date).slice(0, 10),
    hrv: row.hrv ?? undefined,
    zone2: row.zone2 ?? undefined,
    mobilityScore: row.mobility_score ?? undefined,
    sleepHours: row.sleep_hours ?? undefined,
    sleepQuality: row.sleep_quality ?? undefined,
    stressLevel: row.stress_level ?? undefined,
    alcoholUnits: row.alcohol_units ?? undefined,
    notes: row.notes ?? undefined,
  };
}

function rowToVO2Max(row: Record<string, any>): VO2MaxEntry {
  return {
    date: String(row.date).slice(0, 10),
    estimatedVO2Max: row.estimated_vo2_max,
    testMethod: row.test_method,
    notes: row.notes ?? undefined,
  };
}

function rowToMobility(row: Record<string, any>): MobilityAssessment {
  return {
    date: String(row.date).slice(0, 10),
    overallScore: row.overall_score,
    components: row.components ?? {},
    notes: row.notes ?? undefined,
  };
}

function rowToStrength(row: Record<string, any>): StrengthBenchmark {
  return {
    date: String(row.date).slice(0, 10),
    bodyweightKg: row.bodyweight_kg,
    gripStrengthKg: row.grip_strength_kg ?? undefined,
    legPressRatio: row.leg_press_ratio ?? undefined,
    deadliftRatio: row.deadlift_ratio ?? undefined,
    pushUpCount: row.push_up_count ?? undefined,
    pullUpCount: row.pull_up_count ?? undefined,
  };
}

export function useLongevityMetrics() {
  const { user } = useAuth();
  const supabase = createClient();
  const [state, setState] = useState<LongevityState>(DEFAULT_STATE);

  useEffect(() => {
    if (!user) { setState(DEFAULT_STATE); return; }

    Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('daily_longevity_logs').select('*').order('date', { ascending: true }),
      supabase.from('vo2max_history').select('*').order('date', { ascending: true }),
      supabase.from('mobility_history').select('*').order('date', { ascending: true }),
      supabase.from('strength_benchmarks').select('*').order('date', { ascending: true }),
    ]).then(([profileRes, logsRes, vo2Res, mobilityRes, strengthRes]) => {
      setState({
        profile: profileRes.data ? rowToProfile(profileRes.data) : DEFAULT_PROFILE,
        dailyLogs: (logsRes.data ?? []).map(rowToDailyLog),
        vo2MaxHistory: (vo2Res.data ?? []).map(rowToVO2Max),
        mobilityHistory: (mobilityRes.data ?? []).map(rowToMobility),
        strengthBenchmarks: (strengthRes.data ?? []).map(rowToStrength),
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function upsertDailyLog(date: string, updates: Partial<DailyLongevityLog>) {
    if (!user) return;
    const dbRow: Record<string, unknown> = { user_id: user.id, date, updated_at: new Date().toISOString() };
    if ('hrv' in updates) dbRow.hrv = updates.hrv ?? null;
    if ('zone2' in updates) dbRow.zone2 = updates.zone2 ?? null;
    if ('mobilityScore' in updates) dbRow.mobility_score = updates.mobilityScore ?? null;
    if ('sleepHours' in updates) dbRow.sleep_hours = updates.sleepHours ?? null;
    if ('sleepQuality' in updates) dbRow.sleep_quality = updates.sleepQuality ?? null;
    if ('stressLevel' in updates) dbRow.stress_level = updates.stressLevel ?? null;
    if ('alcoholUnits' in updates) dbRow.alcohol_units = updates.alcoholUnits ?? null;
    if ('notes' in updates) dbRow.notes = updates.notes ?? null;

    await supabase.from('daily_longevity_logs').upsert(dbRow, { onConflict: 'user_id,date' });

    setState(prev => {
      const idx = prev.dailyLogs.findIndex(l => l.date === date);
      const existing = prev.dailyLogs[idx] ?? { date };
      const updated = { ...existing, ...updates };
      const logs = [...prev.dailyLogs];
      if (idx >= 0) logs[idx] = updated; else logs.push(updated);
      logs.sort((a, b) => a.date.localeCompare(b.date));
      return { ...prev, dailyLogs: logs };
    });
  }

  async function addVO2MaxEntry(entry: VO2MaxEntry) {
    if (!user) return;
    await supabase.from('vo2max_history').insert({
      user_id: user.id,
      date: entry.date,
      estimated_vo2_max: entry.estimatedVO2Max,
      test_method: entry.testMethod,
      notes: entry.notes ?? null,
    });
    setState(prev => ({
      ...prev,
      vo2MaxHistory: [...prev.vo2MaxHistory, entry].sort((a, b) => a.date.localeCompare(b.date)),
    }));
  }

  async function addMobilityAssessment(assessment: MobilityAssessment) {
    if (!user) return;
    await supabase.from('mobility_history').insert({
      user_id: user.id,
      date: assessment.date,
      overall_score: assessment.overallScore,
      components: assessment.components,
    });
    setState(prev => ({
      ...prev,
      mobilityHistory: [...prev.mobilityHistory, assessment].sort((a, b) => a.date.localeCompare(b.date)),
    }));
  }

  async function addStrengthBenchmark(benchmark: StrengthBenchmark) {
    if (!user) return;
    await supabase.from('strength_benchmarks').insert({
      user_id: user.id,
      date: benchmark.date,
      bodyweight_kg: benchmark.bodyweightKg,
      grip_strength_kg: benchmark.gripStrengthKg ?? null,
      leg_press_ratio: benchmark.legPressRatio ?? null,
      deadlift_ratio: benchmark.deadliftRatio ?? null,
      push_up_count: benchmark.pushUpCount ?? null,
      pull_up_count: benchmark.pullUpCount ?? null,
    });
    setState(prev => ({
      ...prev,
      strengthBenchmarks: [...prev.strengthBenchmarks, benchmark].sort((a, b) => a.date.localeCompare(b.date)),
    }));
  }

  async function updateProfile(updates: Partial<UserProfile>) {
    if (!user) return;
    const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.birthYear !== undefined) dbUpdates.birth_year = updates.birthYear;
    if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
    if (updates.bodyweightKg !== undefined) dbUpdates.bodyweight_kg = updates.bodyweightKg;
    if (updates.heightCm !== undefined) dbUpdates.height_cm = updates.heightCm;
    if (updates.maxHeartRate !== undefined) dbUpdates.max_heart_rate = updates.maxHeartRate;
    if (updates.zone2HrFloor !== undefined) dbUpdates.zone2_hr_floor = updates.zone2HrFloor;
    if (updates.zone2HrCeiling !== undefined) dbUpdates.zone2_hr_ceiling = updates.zone2HrCeiling;
    if (updates.weightUnit !== undefined) dbUpdates.weight_unit = updates.weightUnit;
    if (updates.zone2WeeklyTargetMinutes !== undefined) dbUpdates.zone2_weekly_target_minutes = updates.zone2WeeklyTargetMinutes;
    if (updates.onboardingComplete !== undefined) dbUpdates.onboarding_complete = updates.onboardingComplete;

    await supabase.from('profiles').update(dbUpdates).eq('id', user.id);
    setState(prev => ({ ...prev, profile: { ...prev.profile, ...updates } }));
  }

  async function logTodayMetrics(data: {
    sleepHours?: number; sleepQuality?: number; hrvMs?: number;
    restingHR?: number; mobilityScore?: number; stressLevel?: number;
    zone2Minutes?: number; zone2ActivityType?: 'run' | 'bike' | 'row' | 'swim' | 'walk' | 'other';
    notes?: string;
  }) {
    const today = todayStr();
    const updates: Partial<DailyLongevityLog> = {};
    if (data.sleepHours !== undefined) updates.sleepHours = data.sleepHours;
    if (data.sleepQuality !== undefined) updates.sleepQuality = data.sleepQuality;
    if (data.mobilityScore !== undefined) updates.mobilityScore = data.mobilityScore;
    if (data.stressLevel !== undefined) updates.stressLevel = data.stressLevel;
    if (data.notes !== undefined) updates.notes = data.notes;
    if (data.hrvMs !== undefined) {
      updates.hrv = { date: today, hrvMs: data.hrvMs, restingHeartRate: data.restingHR };
    }
    if (data.zone2Minutes !== undefined) {
      updates.zone2 = { date: today, durationMinutes: data.zone2Minutes, activityType: data.zone2ActivityType ?? 'other' };
    }
    await upsertDailyLog(today, updates);
  }

  const todayLog = state.dailyLogs.find(l => l.date === todayStr());
  const latestVO2 = state.vo2MaxHistory.at(-1);
  const latestMobility = state.mobilityHistory.at(-1);

  return {
    state,
    todayLog,
    latestVO2,
    latestMobility,
    upsertDailyLog,
    addVO2MaxEntry,
    addMobilityAssessment,
    addStrengthBenchmark,
    updateProfile,
    logTodayMetrics,
  };
}
