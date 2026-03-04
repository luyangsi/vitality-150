'use client';

import { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import { subDays, format, parseISO, eachWeekOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import { TrendingUp, Trophy } from 'lucide-react';
import { useWorkoutSessions } from '@/hooks/useWorkoutSessions';
import { useExerciseLibrary } from '@/hooks/useExerciseLibrary';
import { useStreaks } from '@/hooks/useStreaks';
import { estimatedOneRepMax } from '@/lib/calculations/oneRepMax';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatTile } from '@/components/ui/StatTile';
import { MUSCLE_GROUP_COLORS, type MuscleGroup } from '@/types/exercise';
import { formatDate } from '@/lib/utils';

type Range = '1M' | '3M' | '6M' | '1Y' | 'All';
const RANGE_DAYS: Record<Range, number> = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365, 'All': 9999 };

const CUSTOM_TOOLTIP_STYLE = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '8px',
  fontSize: '12px',
  color: '#e2e8f0',
};

export default function ProgressPage() {
  const { sessions } = useWorkoutSessions();
  const { allExercises } = useExerciseLibrary();
  const { currentStreak, longestStreak, weeklyWorkouts } = useStreaks(sessions);

  const [range, setRange] = useState<Range>('3M');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');

  const cutoff = subDays(new Date(), RANGE_DAYS[range]);
  const filtered = sessions.filter(s => s.status === 'completed' && parseISO(s.date) >= cutoff);

  // Weekly volume by muscle group
  const weeklyVolume = useMemo(() => {
    const weeks = eachWeekOfInterval(
      { start: cutoff, end: new Date() },
      { weekStartsOn: 1 }
    ).slice(-12);

    return weeks.map(weekStart => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekSessions = filtered.filter(s => {
        const d = parseISO(s.date);
        return d >= weekStart && d <= weekEnd;
      });
      const row: Record<string, number | string> = { week: format(weekStart, 'MMM d') };
      weekSessions.forEach(session => {
        session.exercises.forEach(ex => {
          ex.sets.filter(s => !s.isWarmup).forEach(set => {
            const muscle = allExercises.find(e => e.id === ex.exerciseId)?.primaryMuscles[0] ?? 'full_body';
            row[muscle] = ((row[muscle] as number) || 0) + set.weight * set.reps;
          });
        });
      });
      return row;
    });
  }, [filtered, allExercises, cutoff]);

  // Strength trend for selected exercise
  const strengthTrend = useMemo(() => {
    if (!selectedExerciseId) return [];
    return filtered
      .flatMap(s => s.exercises
        .filter(e => e.exerciseId === selectedExerciseId)
        .flatMap(e => e.sets.filter(st => !st.isWarmup).map(st => ({
          date: s.date,
          estimated1RM: estimatedOneRepMax(st.weight, st.reps),
        })))
      )
      .reduce((acc: { date: string; estimated1RM: number }[], cur) => {
        const existing = acc.find(r => r.date === cur.date);
        if (existing) {
          if (cur.estimated1RM > existing.estimated1RM) existing.estimated1RM = cur.estimated1RM;
        } else {
          acc.push(cur);
        }
        return acc;
      }, [])
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(r => ({ ...r, date: formatDate(r.date, 'MMM d'), '1RM (kg)': Math.round(r.estimated1RM * 10) / 10 }));
  }, [filtered, selectedExerciseId]);

  // PR timeline
  const prTimeline = useMemo(() => {
    return sessions
      .filter(s => s.status === 'completed')
      .flatMap(s => s.exercises.flatMap(e =>
        e.sets.filter(st => st.isPR).map(st => ({
          date: s.date,
          exercise: e.exerciseName,
          weight: st.weight,
          reps: st.reps,
        }))
      ))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 20);
  }, [sessions]);

  // Muscle distribution
  const muscleDistribution = useMemo(() => {
    const counts: Partial<Record<MuscleGroup, number>> = {};
    filtered.forEach(s => s.exercises.forEach(ex => {
      const muscle = allExercises.find(e => e.id === ex.exerciseId)?.primaryMuscles[0] ?? 'full_body';
      counts[muscle as MuscleGroup] = (counts[muscle as MuscleGroup] || 0) +
        ex.sets.filter(st => !st.isWarmup).reduce((sum, st) => sum + st.weight * st.reps, 0);
    }));
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([muscle, volume]) => ({ name: muscle, value: Math.round(volume as number), color: MUSCLE_GROUP_COLORS[muscle as MuscleGroup] }))
      .sort((a, b) => b.value - a.value);
  }, [filtered, allExercises]);

  // Exercises that have been logged
  const loggedExercises = useMemo(() => {
    const ids = new Set(sessions.flatMap(s => s.exercises.map(e => e.exerciseId)));
    return allExercises.filter(e => ids.has(e.id));
  }, [sessions, allExercises]);

  const totalVolume = Math.round(filtered.flatMap(s => s.exercises.flatMap(e => e.sets.filter(st => !st.isWarmup))).reduce((sum, st) => sum + st.weight * st.reps, 0));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Progress</h1>
        {/* Range selector */}
        <div className="flex gap-1 bg-slate-800 border border-slate-700 rounded-lg p-1">
          {(['1M','3M','6M','1Y','All'] as Range[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                range === r ? 'bg-vitality-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        <StatTile label="Sessions" value={filtered.length} icon={TrendingUp} />
        <StatTile label="Total Volume" value={`${(totalVolume / 1000).toFixed(1)}k`} unit="kg" />
        <StatTile label="Current Streak" value={currentStreak} unit="days" />
        <StatTile label="Workouts / Week" value={weeklyWorkouts} />
      </div>

      {/* Weekly volume chart */}
      <Card>
        <CardHeader><CardTitle>Weekly Volume by Muscle Group</CardTitle></CardHeader>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={weeklyVolume} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
            {Object.keys(MUSCLE_GROUP_COLORS).map(mg => (
              <Bar key={mg} dataKey={mg} stackId="a" fill={MUSCLE_GROUP_COLORS[mg as MuscleGroup]} maxBarSize={40} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Strength trend */}
      <Card>
        <CardHeader>
          <CardTitle>Estimated 1-Rep Max Trend</CardTitle>
          <select
            value={selectedExerciseId}
            onChange={e => setSelectedExerciseId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-vitality-500"
          >
            <option value="">Select exercise...</option>
            {loggedExercises.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
        </CardHeader>
        {strengthTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={strengthTrend} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="1RM (kg)" stroke="#00d4aa" strokeWidth={2} dot={{ r: 3, fill: '#00d4aa' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
            {selectedExerciseId ? 'Not enough data for this exercise' : 'Select an exercise to see strength trend'}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Muscle distribution */}
        <Card>
          <CardHeader><CardTitle>Volume by Muscle Group</CardTitle></CardHeader>
          {muscleDistribution.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={muscleDistribution} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={72} strokeWidth={0}>
                    {muscleDistribution.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {muscleDistribution.slice(0, 6).map(m => (
                  <div key={m.name} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
                    <span className="text-xs text-slate-400 capitalize flex-1">{m.name.replace('_', ' ')}</span>
                    <span className="text-xs font-mono text-slate-300">{(m.value / 1000).toFixed(1)}k</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-slate-500 text-sm">Log workouts to see distribution</div>
          )}
        </Card>

        {/* PR timeline */}
        <Card>
          <CardHeader><CardTitle><Trophy className="w-4 h-4 inline mr-1 text-amber-400" />Recent PRs</CardTitle></CardHeader>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {prTimeline.length > 0 ? prTimeline.map((pr, idx) => (
              <div key={idx} className="flex items-center justify-between bg-amber-500/5 border border-amber-500/10 rounded-lg px-3 py-2">
                <div>
                  <p className="text-xs font-medium text-slate-200">{pr.exercise}</p>
                  <p className="text-xs text-slate-500">{formatDate(pr.date, 'MMM d, yyyy')}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono text-amber-400">{pr.weight}kg × {pr.reps}</p>
                  <p className="text-xs text-slate-500">={Math.round(estimatedOneRepMax(pr.weight, pr.reps))}kg est.</p>
                </div>
              </div>
            )) : (
              <p className="text-slate-500 text-sm text-center py-4">No PRs yet. Keep lifting!</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
