'use client';

import type { ElementType } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap, TrendingUp, Flame, Activity, Dumbbell, Moon, Brain, ArrowRight } from 'lucide-react';
import { uuid } from '@/lib/utils';
import { useWorkoutSessions } from '@/hooks/useWorkoutSessions';
import { useLongevityMetrics } from '@/hooks/useLongevityMetrics';
import { useTemplates } from '@/hooks/useTemplates';
import { useWeeklyPlan } from '@/hooks/useWeeklyPlan';
import { useStreaks } from '@/hooks/useStreaks';
import { useActiveSession } from '@/hooks/useActiveSession';
import { computeLongevityScore } from '@/lib/calculations/longevityScore';
import { computeBiologicalAge } from '@/lib/calculations/biologicalAge';
import { computeLongevityGap } from '@/lib/calculations/longevityGap';
import { aggregateWeeklyZone2 } from '@/lib/calculations/zone2';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatTile } from '@/components/ui/StatTile';
import { formatDuration, formatDate } from '@/lib/utils';
import { subDays, format } from 'date-fns';
import type { LongevityPillar } from '@/types/longevity';

const PILLAR_CONFIG: Record<LongevityPillar, { label: string; color: string; icon: ElementType }> = {
  zone2_cardio:   { label: 'Zone 2',    color: '#22d3ee', icon: Activity   },
  vo2max:         { label: 'VO2 Max',   color: '#60a5fa', icon: TrendingUp },
  strength:       { label: 'Strength',  color: '#fbbf24', icon: Dumbbell   },
  hrv_readiness:  { label: 'HRV',       color: '#c084fc', icon: Brain      },
  mobility:       { label: 'Mobility',  color: '#4ade80', icon: Activity   },
  sleep_recovery: { label: 'Sleep',     color: '#818cf8', icon: Moon       },
};

export default function DashboardPage() {
  const router = useRouter();
  const { sessions } = useWorkoutSessions();
  const { state: longevityState, todayLog } = useLongevityMetrics();
  const { templates } = useTemplates();
  const { getTodayTemplateIds } = useWeeklyPlan();
  const { currentStreak, weeklyWorkouts } = useStreaks(sessions);
  const { session: activeSession, startSession } = useActiveSession();


  const score = computeLongevityScore(longevityState);
  const bioAge = computeBiologicalAge(longevityState);
  const longevityGap = computeLongevityGap(longevityState);
  const profile = longevityState.profile;
  const todayTemplateIds = getTodayTemplateIds();
  const todayTemplates = templates.filter(t => todayTemplateIds.includes(t.id));

  // Zone 2 this week
  const weeklyZone2 = aggregateWeeklyZone2(sessions, longevityState.dailyLogs, new Date());
  const zone2Pct = Math.min(100, Math.round((weeklyZone2 / profile.zone2WeeklyTargetMinutes) * 100));

  // Last 7 days volume
  const recentVolume = sessions
    .filter(s => s.status === 'completed' && s.date >= format(subDays(new Date(), 6), 'yyyy-MM-dd'))
    .flatMap(s => s.exercises.flatMap(e => e.sets.filter(st => !st.isWarmup)))
    .reduce((sum, st) => sum + st.weight * st.reps, 0);

  // Readiness
  const latestHRV = todayLog?.hrv?.hrvMs;
  const readiness = latestHRV
    ? latestHRV >= 60 ? 'green' : latestHRV >= 35 ? 'amber' : 'red'
    : 'neutral';
  const readinessLabel = readiness === 'green' ? 'Ready to Train' : readiness === 'amber' ? 'Moderate Readiness' : readiness === 'red' ? 'Rest Recommended' : 'No HRV Data';

  function handleStartWorkout(templateName: string, templateId: string) {
    const session = {
      id: uuid(),
      name: templateName,
      templateId,
      date: new Date().toISOString().slice(0, 10),
      startTime: new Date().toISOString(),
      status: 'in_progress' as const,
      exercises: [],
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    startSession(session);
    router.push(`/log/${session.id}`);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {profile.name ? `Hey, ${profile.name}` : 'Dashboard'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Your longevity command center</p>
        </div>
        {!profile.onboardingComplete && (
          <Link href="/longevity">
            <Button variant="secondary" size="sm">Complete Profile →</Button>
          </Link>
        )}
      </div>

      {/* Hero: Longevity Score + Pillar breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card glow className="flex flex-col items-center justify-center py-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Longevity Score</p>
          <ProgressRing
            value={score.overall}
            size={180}
            strokeWidth={12}
            label={String(score.overall)}
            sublabel="/ 100"
          />
          <div className="mt-4 flex items-center gap-2">
            <span className={`text-xs font-medium ${
              score.trend === 'improving' ? 'text-vitality-600' :
              score.trend === 'declining' ? 'text-rose-400' : 'text-slate-400'
            }`}>
              {score.trend === 'improving' ? '↑ Improving' : score.trend === 'declining' ? '↓ Declining' : '→ Stable'}
            </span>
          </div>
        </Card>

        {/* Pillar scores */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(Object.entries(score.breakdown) as [LongevityPillar, number][]).map(([pillar, val]) => {
            const cfg = PILLAR_CONFIG[pillar];
            const Icon = cfg.icon;
            return (
              <div key={pillar} className="bg-slate-800 border border-slate-700 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                  <span className="text-xs text-slate-400">{cfg.label}</span>
                </div>
                <div className="flex items-end gap-1">
                  <span className="font-mono text-xl font-bold" style={{ color: cfg.color }}>{val}</span>
                  <span className="text-gray-400 text-xs mb-0.5">/100</span>
                </div>
                <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${val}%`, backgroundColor: cfg.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Streak" value={currentStreak} unit={currentStreak === 1 ? 'day' : 'days'} icon={Flame} color="#fbbf24" />
        <StatTile label="This Week" value={weeklyWorkouts} unit="sessions" icon={Dumbbell} />
        <StatTile label="Weekly Volume" value={`${Math.round(recentVolume / 100) / 10}k`} unit="kg" icon={TrendingUp} />
        <StatTile label="Zone 2 This Week" value={weeklyZone2} unit="min" icon={Activity} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Readiness card */}
        <Card>
          <CardHeader><CardTitle>Readiness</CardTitle></CardHeader>
          <div className="flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
              readiness === 'green' ? 'bg-green-500' :
              readiness === 'amber' ? 'bg-amber-500' :
              readiness === 'red'   ? 'bg-rose-500' :
              'bg-slate-600'
            }`} />
            <div>
              <p className="font-semibold text-gray-800">{readinessLabel}</p>
              {latestHRV && <p className="text-xs text-gray-500 mt-0.5">HRV: {latestHRV}ms · Sleep: {todayLog?.sleepHours ?? '–'}h</p>}
              {!latestHRV && <p className="text-xs text-gray-500 mt-0.5">Log your HRV in <Link href="/longevity" className="text-vitality-600">Longevity Hub</Link></p>}
            </div>
          </div>
        </Card>

        {/* Zone 2 progress */}
        <Card>
          <CardHeader>
            <CardTitle>Zone 2 This Week</CardTitle>
            <span className="text-xs text-gray-500">{weeklyZone2}/{profile.zone2WeeklyTargetMinutes} min</span>
          </CardHeader>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-vitality-500 rounded-full transition-all duration-500"
                style={{ width: `${zone2Pct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{zone2Pct}% of weekly goal</span>
              <span>{formatDuration(Math.max(0, profile.zone2WeeklyTargetMinutes - weeklyZone2))} remaining</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Biological Age + Priority Focus */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Biological Age */}
        <Card>
          <CardHeader><CardTitle>Biological Age</CardTitle></CardHeader>
          {bioAge ? (
            <div className="space-y-3">
              <div className="flex items-end gap-3">
                <span className="text-5xl font-bold text-gray-900">{bioAge.biologicalAge}</span>
                <span className="text-lg text-gray-400 mb-1">yrs</span>
              </div>
              <p className="text-sm text-gray-500">vs {bioAge.chronologicalAge} chronological</p>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                bioAge.deltaYears <= 0
                  ? 'bg-vitality-50 text-vitality-700'
                  : 'bg-rose-50 text-rose-600'
              }`}>
                <span>{bioAge.deltaYears <= 0 ? '↓' : '↑'}</span>
                <span>
                  {Math.abs(bioAge.deltaYears)} {Math.abs(bioAge.deltaYears) === 1 ? 'year' : 'years'}{' '}
                  {bioAge.deltaYears <= 0 ? 'younger' : 'older'} than your age
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Based on:{' '}
                {[
                  bioAge.breakdown.vo2max !== undefined && 'VO2 Max',
                  bioAge.breakdown.hrv !== undefined && 'HRV',
                  bioAge.breakdown.strength !== undefined && 'Strength',
                ].filter(Boolean).join(' · ')}
                {' '}· {bioAge.confidence} confidence
              </p>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">No fitness data yet.</p>
              <Link href="/longevity" className="text-xs text-vitality-600 hover:text-vitality-700 mt-1 inline-block">
                Log data in Longevity Hub to unlock →
              </Link>
            </div>
          )}
        </Card>

        {/* Priority Focus */}
        <Card>
          <CardHeader><CardTitle>Priority Focus</CardTitle></CardHeader>
          {longevityGap ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800">{longevityGap.pillarLabel}</span>
                <span className="text-xs text-gray-400">score: {longevityGap.currentScore}/100</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-400 rounded-full"
                  style={{ width: `${longevityGap.currentScore}%` }}
                />
              </div>
              <p className="text-sm font-medium text-vitality-600">
                Fix this → +{longevityGap.pointsGained} overall point{longevityGap.pointsGained !== 1 ? 's' : ''}
              </p>
              <p className="text-sm text-gray-600">{longevityGap.action}</p>
              <Link
                href={longevityGap.actionLink}
                className="inline-flex items-center gap-1 text-xs text-vitality-600 hover:text-vitality-700 font-medium mt-1"
              >
                Take action <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-2xl mb-1">🎯</p>
              <p className="text-sm font-semibold text-gray-800">You&apos;re crushing it</p>
              <p className="text-xs text-gray-500 mt-1">All pillars are strong — keep it up</p>
            </div>
          )}
        </Card>
      </div>

      {/* Today's workout */}
      <Card>
        <CardHeader>
          <CardTitle><Zap className="w-4 h-4 inline mr-1 text-vitality-600" />Today&apos;s Plan</CardTitle>
          <Link href="/log" className="text-xs text-vitality-600 hover:text-vitality-400">View all →</Link>
        </CardHeader>
        {activeSession ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-600">In Progress: {activeSession.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{activeSession.exercises.length} exercises logged</p>
            </div>
            <Link href={`/log/${activeSession.id}`}>
              <Button size="sm">Resume</Button>
            </Link>
          </div>
        ) : todayTemplates.length > 0 ? (
          <div className="space-y-2">
            {todayTemplates.map(t => (
              <div key={t.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.estimatedDurationMinutes}min · {t.exercises.length} exercises</p>
                </div>
                <Button size="sm" onClick={() => handleStartWorkout(t.name, t.id)}>
                  <Zap className="w-3.5 h-3.5" /> Start
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500 text-sm">Nothing planned for today.</p>
            <div className="flex gap-2 justify-center mt-3">
              <Link href="/planner"><Button variant="secondary" size="sm">Open Planner</Button></Link>
              <Link href="/log"><Button size="sm">Quick Start</Button></Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
