import type { LongevityState } from '@/types/longevity';
import { getBenchmarkForUser, computeStrengthScore } from './strengthBenchmarks';

export interface BioAgeResult {
  biologicalAge: number;
  chronologicalAge: number;
  deltaYears: number;          // negative = younger than real age
  confidence: 'high' | 'medium' | 'low';
  breakdown: { vo2max?: number; hrv?: number; strength?: number };
}

// VO2 Max average by decade (from longevityScore.ts norms)
const VO2_AVG: Record<string, Record<number, number>> = {
  male:   { 30: 44, 40: 42, 50: 38, 60: 34, 70: 30 },
  female: { 30: 38, 40: 35, 50: 32, 60: 28, 70: 25 },
};

// Reverse-map: given a VO2 max value, estimate the age where it's "average"
function vo2maxBioAge(vo2max: number, gender: string): number {
  const table = VO2_AVG[gender === 'female' ? 'female' : 'male'];
  const decades = [30, 40, 50, 60, 70];

  // Above 30s average → younger than 30
  if (vo2max >= table[30]) {
    return Math.max(20, 30 - (vo2max - table[30]) * 1.5);
  }
  // Below 70s average → older than 70
  if (vo2max <= table[70]) {
    return Math.min(90, 70 + (table[70] - vo2max) * 1.5);
  }
  // Interpolate between decade brackets
  for (let i = 0; i < decades.length - 1; i++) {
    const d1 = decades[i];
    const d2 = decades[i + 1];
    const v1 = table[d1];
    const v2 = table[d2];
    if (vo2max <= v1 && vo2max >= v2) {
      const t = (v1 - vo2max) / (v1 - v2);
      return d1 + t * (d2 - d1);
    }
  }
  return 40; // fallback
}

// HRV bio age: declines ~1ms/year; ref 30yo ≈ 65ms male / 60ms female
function hrvBioAge(hrv: number, gender: string): number {
  const ref30 = gender === 'female' ? 60 : 65;
  return Math.min(90, Math.max(20, 30 + (ref30 - hrv)));
}

// Strength bio age: benchmark ratio → ±10 years from chronological
function strengthBioAge(
  bench: { gripStrengthKg?: number; legPressRatio?: number; pushUpCount?: number },
  chronologicalAge: number,
  gender: string
): number | null {
  const benchmark = getBenchmarkForUser(chronologicalAge, gender);
  const score = computeStrengthScore(bench.gripStrengthKg, bench.legPressRatio, bench.pushUpCount, benchmark);
  if (score === 50 && !bench.gripStrengthKg && !bench.legPressRatio && !bench.pushUpCount) {
    return null; // no data
  }
  // 100% benchmark = chronological age; ≥120% = -10yr; ≤60% = +10yr
  const pct = score / 100;
  if (pct >= 1.2) return Math.max(20, chronologicalAge - 10);
  if (pct >= 1.0) return chronologicalAge - (pct - 1.0) / 0.2 * 10;
  if (pct >= 0.6) return chronologicalAge + (1.0 - pct) / 0.4 * 10;
  return Math.min(90, chronologicalAge + 10);
}

export function computeBiologicalAge(state: LongevityState): BioAgeResult | null {
  const profile = state.profile;
  const chronologicalAge = new Date().getFullYear() - profile.birthYear;
  const gender = profile.gender;

  const breakdown: BioAgeResult['breakdown'] = {};

  // VO2 Max
  const latestVO2 = state.vo2MaxHistory.at(-1);
  if (latestVO2) {
    breakdown.vo2max = vo2maxBioAge(latestVO2.estimatedVO2Max, gender);
  }

  // HRV — average of last 7 days
  const recentHRVs = state.dailyLogs
    .slice(-7)
    .map(l => l.hrv?.hrvMs)
    .filter((v): v is number => v !== undefined);
  if (recentHRVs.length > 0) {
    const avgHRV = recentHRVs.reduce((a, b) => a + b, 0) / recentHRVs.length;
    breakdown.hrv = hrvBioAge(avgHRV, gender);
  }

  // Strength
  const latestBench = state.strengthBenchmarks.at(-1);
  if (latestBench) {
    const sAge = strengthBioAge(latestBench, chronologicalAge, gender);
    if (sAge !== null) breakdown.strength = sAge;
  }

  const markers = Object.keys(breakdown);
  if (markers.length === 0) return null;

  // Weighted composite
  const weights: Record<string, number> = { vo2max: 0.5, hrv: 0.3, strength: 0.2 };
  let totalWeight = 0;
  let weightedSum = 0;
  for (const [key, age] of Object.entries(breakdown)) {
    const w = weights[key];
    weightedSum += age * w;
    totalWeight += w;
  }
  const biologicalAge = Math.round(weightedSum / totalWeight);

  const confidence: BioAgeResult['confidence'] =
    markers.length >= 3 ? 'high' : markers.length === 2 ? 'medium' : 'low';

  return {
    biologicalAge,
    chronologicalAge,
    deltaYears: biologicalAge - chronologicalAge,
    confidence,
    breakdown,
  };
}
