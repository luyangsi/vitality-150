'use client';

import { useMemo } from 'react';
import type { WorkoutSession } from '@/types/session';
import { todayStr } from '@/lib/utils';
import { format, subDays } from 'date-fns';

export function useStreaks(sessions: WorkoutSession[]) {
  return useMemo(() => {
    const completedDates = new Set(
      sessions.filter(s => s.status === 'completed').map(s => s.date)
    );

    // Current streak — consecutive days going back from today
    let streak = 0;
    let d = new Date();
    while (true) {
      const key = format(d, 'yyyy-MM-dd');
      if (!completedDates.has(key)) break;
      streak++;
      d = subDays(d, 1);
    }

    // Longest streak
    const sortedDates = Array.from(completedDates).sort();
    let longest = 0, current = 0;
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) { current = 1; continue; }
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
      current = diff === 1 ? current + 1 : 1;
      if (current > longest) longest = current;
    }
    if (current > longest) longest = current;

    // Weekly count
    const weekStart = format(subDays(new Date(), 6), 'yyyy-MM-dd');
    const weeklyCount = sortedDates.filter(d => d >= weekStart).length;

    return { currentStreak: streak, longestStreak: longest, weeklyWorkouts: weeklyCount };
  }, [sessions]);
}
