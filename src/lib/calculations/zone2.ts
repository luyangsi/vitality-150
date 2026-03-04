import { parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import type { WorkoutSession } from '@/types/session';
import type { DailyLongevityLog } from '@/types/longevity';

export function getMaffetoneZone2Ceiling(age: number): number {
  return 180 - age;
}

export function getZone2Range(maxHR: number): [number, number] {
  return [Math.round(maxHR * 0.60), Math.round(maxHR * 0.70)];
}

export function aggregateWeeklyZone2(
  sessions: WorkoutSession[],
  dailyLogs: DailyLongevityLog[],
  weekStart: Date
): number {
  const interval = {
    start: startOfWeek(weekStart, { weekStartsOn: 1 }),
    end:   endOfWeek(weekStart, { weekStartsOn: 1 }),
  };

  const fromSessions = sessions
    .filter(s => s.status === 'completed' && s.zone2MinutesLogged)
    .filter(s => isWithinInterval(parseISO(s.date), interval))
    .reduce((sum, s) => sum + (s.zone2MinutesLogged ?? 0), 0);

  const fromLogs = dailyLogs
    .filter(l => l.zone2)
    .filter(l => isWithinInterval(parseISO(l.date), interval))
    .reduce((sum, l) => sum + (l.zone2?.durationMinutes ?? 0), 0);

  return fromSessions + fromLogs;
}

export function getLast12WeeksZone2(
  sessions: WorkoutSession[],
  dailyLogs: DailyLongevityLog[]
): Array<{ week: string; minutes: number }> {
  const result: Array<{ week: string; minutes: number }> = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - i * 7);
    const monday = startOfWeek(weekStart, { weekStartsOn: 1 });
    const minutes = aggregateWeeklyZone2(sessions, dailyLogs, monday);
    result.push({
      week: monday.toISOString().slice(0, 10),
      minutes,
    });
  }
  return result;
}
