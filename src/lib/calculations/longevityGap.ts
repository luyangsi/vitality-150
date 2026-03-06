import type { LongevityState, LongevityPillar } from '@/types/longevity';
import { computeLongevityScore } from './longevityScore';

export interface LongevityGap {
  weakestPillar: LongevityPillar;
  pillarLabel: string;
  currentScore: number;
  targetScore: number;   // 80
  pointsGained: number;  // estimated overall score gain
  action: string;
  actionLink: string;    // route to navigate to
}

const PILLAR_WEIGHTS: Record<LongevityPillar, number> = {
  zone2_cardio:   0.25,
  vo2max:         0.25,
  strength:       0.20,
  hrv_readiness:  0.15,
  mobility:       0.10,
  sleep_recovery: 0.05,
};

const PILLAR_LABELS: Record<LongevityPillar, string> = {
  zone2_cardio:   'Zone 2 Cardio',
  vo2max:         'VO2 Max',
  strength:       'Strength',
  hrv_readiness:  'HRV & Readiness',
  mobility:       'Mobility',
  sleep_recovery: 'Sleep & Recovery',
};

const PILLAR_ACTIONS: Record<LongevityPillar, { action: string; link: string }> = {
  zone2_cardio:   { action: 'Add 2 more Zone 2 sessions this week (aim for 150+ min total)', link: '/log' },
  vo2max:         { action: 'Include one 20-min tempo run or cycling interval session per week', link: '/log' },
  strength:       { action: 'Log a strength benchmark — grip test + push-ups take under 5 minutes', link: '/longevity' },
  hrv_readiness:  { action: 'Prioritize 8h sleep and cut evening screens for 7 days', link: '/longevity' },
  mobility:       { action: 'Add a 10-min daily mobility routine and log it in Longevity Hub', link: '/longevity' },
  sleep_recovery: { action: 'Set a consistent bedtime and log sleep nightly this week', link: '/longevity' },
};

export function computeLongevityGap(state: LongevityState): LongevityGap | null {
  const score = computeLongevityScore(state);

  if (score.overall >= 85) return null;

  const breakdown = score.breakdown;
  const pillars = Object.keys(breakdown) as LongevityPillar[];

  // Find weakest pillar; break ties by highest weight (most impactful)
  let weakest = pillars[0];
  for (const p of pillars) {
    if (
      breakdown[p] < breakdown[weakest] ||
      (breakdown[p] === breakdown[weakest] && PILLAR_WEIGHTS[p] > PILLAR_WEIGHTS[weakest])
    ) {
      weakest = p;
    }
  }

  const currentScore = breakdown[weakest];
  const targetScore = 80;

  // Simulate boosting the weakest pillar to 80 and recalculate overall
  const simulated = { ...breakdown, [weakest]: targetScore };
  const simulatedOverall = Math.round(
    (Object.entries(simulated) as [LongevityPillar, number][]).reduce(
      (sum, [p, s]) => sum + s * PILLAR_WEIGHTS[p],
      0
    )
  );
  const pointsGained = simulatedOverall - score.overall;

  const { action, link } = PILLAR_ACTIONS[weakest];

  return {
    weakestPillar: weakest,
    pillarLabel: PILLAR_LABELS[weakest],
    currentScore,
    targetScore,
    pointsGained,
    action,
    actionLink: link,
  };
}
