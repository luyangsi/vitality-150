// Peter Attia-inspired strength benchmarks by age decade
// Values: gripKg, legPressRatio (x bodyweight), deadliftRatio, pushUps, pullUps

interface Benchmark {
  gripKg: number;
  legPressRatio: number;
  deadliftRatio: number;
  pushUps: number;
  pullUps: number;
}

const BENCHMARKS: Record<string, Record<number, Benchmark>> = {
  male: {
    30: { gripKg: 52, legPressRatio: 2.0, deadliftRatio: 1.75, pushUps: 40, pullUps: 12 },
    40: { gripKg: 48, legPressRatio: 1.8, deadliftRatio: 1.50, pushUps: 30, pullUps:  8 },
    50: { gripKg: 44, legPressRatio: 1.6, deadliftRatio: 1.25, pushUps: 20, pullUps:  5 },
    60: { gripKg: 40, legPressRatio: 1.4, deadliftRatio: 1.00, pushUps: 15, pullUps:  3 },
    70: { gripKg: 35, legPressRatio: 1.2, deadliftRatio: 0.75, pushUps: 10, pullUps:  1 },
  },
  female: {
    30: { gripKg: 34, legPressRatio: 1.6, deadliftRatio: 1.25, pushUps: 25, pullUps:  6 },
    40: { gripKg: 31, legPressRatio: 1.4, deadliftRatio: 1.00, pushUps: 18, pullUps:  4 },
    50: { gripKg: 28, legPressRatio: 1.2, deadliftRatio: 0.85, pushUps: 12, pullUps:  2 },
    60: { gripKg: 25, legPressRatio: 1.0, deadliftRatio: 0.70, pushUps:  8, pullUps:  1 },
    70: { gripKg: 22, legPressRatio: 0.9, deadliftRatio: 0.55, pushUps:  5, pullUps:  0 },
  },
};

export function getBenchmarkForUser(age: number, gender: string): Benchmark {
  const decade = Math.max(30, Math.min(70, Math.floor(age / 10) * 10));
  const genderKey = gender === 'female' ? 'female' : 'male';
  return BENCHMARKS[genderKey][decade] ?? BENCHMARKS.male[40];
}

export function computeStrengthScore(
  userGripKg: number | undefined,
  userLegPressRatio: number | undefined,
  userPushUps: number | undefined,
  benchmark: Benchmark
): number {
  const scores: number[] = [];
  if (userGripKg) scores.push(Math.min(100, (userGripKg / benchmark.gripKg) * 100));
  if (userLegPressRatio) scores.push(Math.min(100, (userLegPressRatio / benchmark.legPressRatio) * 100));
  if (userPushUps) scores.push(Math.min(100, (userPushUps / benchmark.pushUps) * 100));
  if (scores.length === 0) return 50; // default if no data
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}
