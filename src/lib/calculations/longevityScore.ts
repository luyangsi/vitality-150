import type { LongevityPillar, LongevityScore, LongevityState } from '@/types/longevity';
import { aggregateWeeklyZone2, getLast12WeeksZone2 } from './zone2';
import { getBenchmarkForUser, computeStrengthScore } from './strengthBenchmarks';
import { todayStr } from '@/lib/utils';

const PILLAR_WEIGHTS: Record<LongevityPillar, number> = {
  zone2_cardio:   0.25,
  vo2max:         0.25,
  strength:       0.20,
  hrv_readiness:  0.15,
  mobility:       0.10,
  sleep_recovery: 0.05,
};

// VO2 Max percentile lookup (simplified — age-based norms for men/women)
function computeVO2MaxScore(vo2max: number, age: number, gender: string): number {
  // Excellent thresholds by age (male / female, 95th percentile)
  const excellent: Record<string, number> = {
    male:   age < 30 ? 55 : age < 40 ? 53 : age < 50 ? 48 : age < 60 ? 43 : 38,
    female: age < 30 ? 49 : age < 40 ? 46 : age < 50 ? 42 : age < 60 ? 37 : 33,
  };
  const avg: Record<string, number> = {
    male:   age < 30 ? 44 : age < 40 ? 42 : age < 50 ? 38 : age < 60 ? 34 : 30,
    female: age < 30 ? 38 : age < 40 ? 35 : age < 50 ? 32 : age < 60 ? 28 : 25,
  };
  const gKey = gender === 'female' ? 'female' : 'male';
  const ex = excellent[gKey];
  const av = avg[gKey];
  if (vo2max >= ex) return 100;
  if (vo2max <= av * 0.6) return 10;
  return Math.round(((vo2max - av * 0.6) / (ex - av * 0.6)) * 100);
}

function computeHRVScore(recentHRV: number[]): number {
  if (recentHRV.length === 0) return 50;
  const avg = recentHRV.reduce((a, b) => a + b, 0) / recentHRV.length;
  // HRV > 80ms = excellent, < 20ms = poor
  if (avg >= 80) return 100;
  if (avg <= 20) return 10;
  return Math.round(((avg - 20) / 60) * 90 + 10);
}

function computeSleepScore(sleepHours: number[], sleepQualities: number[]): number {
  if (sleepHours.length === 0) return 50;
  const avgH = sleepHours.reduce((a, b) => a + b, 0) / sleepHours.length;
  const avgQ = sleepQualities.length > 0
    ? sleepQualities.reduce((a, b) => a + b, 0) / sleepQualities.length
    : 3;
  const hoursScore = avgH >= 8 ? 100 : avgH >= 7 ? 80 : avgH >= 6 ? 55 : 30;
  const qualScore  = (avgQ / 5) * 100;
  return Math.round((hoursScore + qualScore) / 2);
}

export function computeLongevityScore(state: LongevityState): LongevityScore {
  const profile = state.profile;
  const age = new Date().getFullYear() - profile.birthYear;

  // Zone 2 — last 7 days
  const zone2Min = aggregateWeeklyZone2([], state.dailyLogs, new Date());
  const zone2Score = Math.min(100, Math.round((zone2Min / profile.zone2WeeklyTargetMinutes) * 100));

  // VO2 Max — most recent entry
  const latestVO2 = state.vo2MaxHistory.at(-1);
  const vo2Score  = latestVO2 ? computeVO2MaxScore(latestVO2.estimatedVO2Max, age, profile.gender) : 50;

  // HRV — last 7 days
  const recentHRVs = state.dailyLogs
    .slice(-7)
    .map(l => l.hrv?.hrvMs)
    .filter((v): v is number => v !== undefined);
  const hrvScore = computeHRVScore(recentHRVs);

  // Strength — latest benchmark
  const latestBench = state.strengthBenchmarks.at(-1);
  const benchmark   = getBenchmarkForUser(age, profile.gender);
  const strengthScore = latestBench
    ? computeStrengthScore(latestBench.gripStrengthKg, latestBench.legPressRatio, latestBench.pushUpCount, benchmark)
    : 50;

  // Mobility — last 7 days average
  const recentMobility = state.dailyLogs
    .slice(-7)
    .map(l => l.mobilityScore)
    .filter((v): v is number => v !== undefined);
  const mobilityScore = recentMobility.length > 0
    ? Math.round(recentMobility.reduce((a, b) => a + b, 0) / recentMobility.length)
    : 50;

  // Sleep — last 7 days
  const recentSleepH = state.dailyLogs.slice(-7).map(l => l.sleepHours).filter((v): v is number => v !== undefined);
  const recentSleepQ = state.dailyLogs.slice(-7).map(l => l.sleepQuality).filter((v): v is number => v !== undefined);
  const sleepScore   = computeSleepScore(recentSleepH, recentSleepQ);

  const breakdown: Record<LongevityPillar, number> = {
    zone2_cardio:   zone2Score,
    vo2max:         vo2Score,
    strength:       strengthScore,
    hrv_readiness:  hrvScore,
    mobility:       mobilityScore,
    sleep_recovery: sleepScore,
  };

  const overall = Math.round(
    Object.entries(breakdown).reduce(
      (sum, [pillar, score]) => sum + score * PILLAR_WEIGHTS[pillar as LongevityPillar],
      0
    )
  );

  // Trend: compare last 7 vs prior 7 days' overall (simplified)
  const trend: LongevityScore['trend'] = 'stable';

  return { date: todayStr(), overall, breakdown, trend };
}
