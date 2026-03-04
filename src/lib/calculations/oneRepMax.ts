// Epley formula (best for 1-10 reps)
export function epley(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

// Brzycki formula (good for higher reps)
export function brzycki(weight: number, reps: number): number {
  if (reps >= 37) return weight; // formula breaks down
  return weight * (36 / (37 - reps));
}

export function estimatedOneRepMax(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  const est = reps <= 10 ? epley(weight, reps) : brzycki(weight, reps);
  return Math.round(est * 10) / 10;
}
