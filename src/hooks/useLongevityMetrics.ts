'use client';

import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import type { LongevityState, DailyLongevityLog, VO2MaxEntry, MobilityAssessment, StrengthBenchmark, UserProfile } from '@/types/longevity';
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

export function useLongevityMetrics() {
  const [state, setState] = useLocalStorage<LongevityState>(STORAGE_KEYS.LONGEVITY, DEFAULT_STATE);

  function upsertDailyLog(date: string, updates: Partial<DailyLongevityLog>) {
    setState(prev => {
      const idx = prev.dailyLogs.findIndex(l => l.date === date);
      const existing = prev.dailyLogs[idx] ?? { date };
      const updated = { ...existing, ...updates };
      const logs = [...prev.dailyLogs];
      if (idx >= 0) logs[idx] = updated;
      else logs.push(updated);
      logs.sort((a, b) => a.date.localeCompare(b.date));
      return { ...prev, dailyLogs: logs };
    });
  }

  function addVO2MaxEntry(entry: VO2MaxEntry) {
    setState(prev => ({
      ...prev,
      vo2MaxHistory: [...prev.vo2MaxHistory, entry].sort((a, b) => a.date.localeCompare(b.date)),
    }));
  }

  function addMobilityAssessment(assessment: MobilityAssessment) {
    setState(prev => ({
      ...prev,
      mobilityHistory: [...prev.mobilityHistory, assessment].sort((a, b) => a.date.localeCompare(b.date)),
    }));
  }

  function addStrengthBenchmark(benchmark: StrengthBenchmark) {
    setState(prev => ({
      ...prev,
      strengthBenchmarks: [...prev.strengthBenchmarks, benchmark].sort((a, b) => a.date.localeCompare(b.date)),
    }));
  }

  function updateProfile(updates: Partial<UserProfile>) {
    setState(prev => ({ ...prev, profile: { ...prev.profile, ...updates } }));
  }

  function logTodayMetrics(data: {
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
      updates.zone2 = {
        date: today,
        durationMinutes: data.zone2Minutes,
        activityType: data.zone2ActivityType ?? 'other',
      };
    }
    upsertDailyLog(today, updates);
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
