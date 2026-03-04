'use client';

import { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, ReferenceLine,
  AreaChart, Area
} from 'recharts';
import { Plus, Activity, TrendingUp, Brain, Moon, Dumbbell, Heart } from 'lucide-react';
import { useLongevityMetrics } from '@/hooks/useLongevityMetrics';
import { useWorkoutSessions } from '@/hooks/useWorkoutSessions';
import { computeLongevityScore } from '@/lib/calculations/longevityScore';
import { getLast12WeeksZone2 } from '@/lib/calculations/zone2';
import { getBenchmarkForUser } from '@/lib/calculations/strengthBenchmarks';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { formatDate, todayStr } from '@/lib/utils';
import type { LongevityPillar } from '@/types/longevity';

const TOOLTIP_STYLE = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '8px',
  fontSize: '12px',
  color: '#e2e8f0',
};

const PILLAR_LABELS: Record<LongevityPillar, string> = {
  zone2_cardio:   'Zone 2 Cardio',
  vo2max:         'VO2 Max',
  hrv_readiness:  'HRV / Readiness',
  strength:       'Strength',
  mobility:       'Mobility',
  sleep_recovery: 'Sleep',
};

export default function LongevityPage() {
  const { state, updateProfile, logTodayMetrics, addVO2MaxEntry, addStrengthBenchmark } = useLongevityMetrics();
  const { sessions } = useWorkoutSessions();
  const [showMetricModal, setShowMetricModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showVO2Modal, setShowVO2Modal] = useState(false);
  const [showBenchmarkModal, setShowBenchmarkModal] = useState(false);

  // Metric log form state
  const [metricForm, setMetricForm] = useState({
    sleepHours: '', sleepQuality: '3', hrvMs: '', restingHR: '',
    mobilityScore: '', stressLevel: '3', zone2Minutes: '', zone2ActivityType: 'run' as const,
    notes: '',
  });

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: state.profile.name,
    birthYear: String(state.profile.birthYear),
    gender: state.profile.gender,
    bodyweightKg: String(state.profile.bodyweightKg),
    heightCm: String(state.profile.heightCm),
    weightUnit: state.profile.weightUnit,
    zone2WeeklyTargetMinutes: String(state.profile.zone2WeeklyTargetMinutes),
  });

  const [vo2Form, setVo2Form] = useState({ estimatedVO2Max: '', testMethod: 'manual' as const, notes: '' });
  const [benchForm, setBenchForm] = useState({ gripStrengthKg: '', legPressRatio: '', pushUpCount: '', pullUpCount: '', bodyweightKg: String(state.profile.bodyweightKg) });

  const score = computeLongevityScore(state);
  const profile = state.profile;
  const age = new Date().getFullYear() - profile.birthYear;

  // Zone 2 chart data
  const zone2Data = getLast12WeeksZone2(sessions, state.dailyLogs).map(w => ({
    week: formatDate(w.week, 'MMM d'),
    minutes: w.minutes,
  }));

  // HRV chart data
  const hrvData = state.dailyLogs
    .filter(l => l.hrv)
    .slice(-30)
    .map(l => ({
      date: formatDate(l.date, 'MMM d'),
      hrv: l.hrv!.hrvMs,
      sleep: l.sleepHours,
    }));

  // VO2 Max chart
  const vo2Data = state.vo2MaxHistory.map(v => ({
    date: formatDate(v.date, 'MMM d yyyy'),
    'VO2 Max': v.estimatedVO2Max,
  }));

  // Radar chart (longevity breakdown)
  const radarData = (Object.entries(score.breakdown) as [LongevityPillar, number][]).map(([pillar, val]) => ({
    pillar: PILLAR_LABELS[pillar],
    score: val,
  }));

  // Strength benchmarks
  const benchmark = getBenchmarkForUser(age, profile.gender);
  const latestBench = state.strengthBenchmarks.at(-1);

  function handleSaveMetrics() {
    logTodayMetrics({
      sleepHours: metricForm.sleepHours ? Number(metricForm.sleepHours) : undefined,
      sleepQuality: Number(metricForm.sleepQuality),
      hrvMs: metricForm.hrvMs ? Number(metricForm.hrvMs) : undefined,
      restingHR: metricForm.restingHR ? Number(metricForm.restingHR) : undefined,
      mobilityScore: metricForm.mobilityScore ? Number(metricForm.mobilityScore) : undefined,
      stressLevel: Number(metricForm.stressLevel),
      zone2Minutes: metricForm.zone2Minutes ? Number(metricForm.zone2Minutes) : undefined,
      zone2ActivityType: metricForm.zone2ActivityType,
      notes: metricForm.notes || undefined,
    });
    setShowMetricModal(false);
  }

  function handleSaveProfile() {
    updateProfile({
      name: profileForm.name,
      birthYear: Number(profileForm.birthYear),
      gender: profileForm.gender as 'male' | 'female' | 'other',
      bodyweightKg: Number(profileForm.bodyweightKg),
      heightCm: Number(profileForm.heightCm),
      weightUnit: profileForm.weightUnit as 'kg' | 'lbs',
      zone2WeeklyTargetMinutes: Number(profileForm.zone2WeeklyTargetMinutes),
      onboardingComplete: true,
    });
    setShowProfileModal(false);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Longevity Hub</h1>
          <p className="text-slate-400 text-sm mt-1">Science-backed metrics for a 150-year life</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowProfileModal(true)}>Profile</Button>
          <Button onClick={() => setShowMetricModal(true)}>
            <Plus className="w-4 h-4" /> Log Today
          </Button>
        </div>
      </div>

      {/* Score overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card glow className="flex flex-col items-center py-6">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-4">Longevity Score</p>
          <ProgressRing value={score.overall} size={160} strokeWidth={10} label={String(score.overall)} sublabel="/ 100" />
          <p className="text-xs text-slate-400 mt-3">Age: {age} · {profile.gender}</p>
        </Card>

        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader><CardTitle>Pillar Breakdown</CardTitle></CardHeader>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="pillar" tick={{ fill: '#64748b', fontSize: 10 }} />
                <Radar name="Score" dataKey="score" stroke="#00d4aa" fill="#00d4aa" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>

      {/* Zone 2 cardio */}
      <Card>
        <CardHeader>
          <CardTitle><Activity className="w-4 h-4 inline mr-1 text-cyan-400" />Zone 2 Cardio — 12 Week Trend</CardTitle>
          <span className="text-xs text-slate-500">Target: {profile.zone2WeeklyTargetMinutes} min/week</span>
        </CardHeader>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={zone2Data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <ReferenceLine y={profile.zone2WeeklyTargetMinutes} stroke="#22d3ee" strokeDasharray="4 4" label={{ value: 'Target', fill: '#22d3ee', fontSize: 10 }} />
            <Bar dataKey="minutes" fill="#22d3ee" fillOpacity={0.8} radius={[3,3,0,0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-slate-500 mt-2">Zone 2 = 60-70% max HR ({Math.round((220 - age) * 0.6)}–{Math.round((220 - age) * 0.7)} bpm est.) · Maffetone ceiling: {180 - age} bpm</p>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* HRV chart */}
        <Card>
          <CardHeader>
            <CardTitle><Brain className="w-4 h-4 inline mr-1 text-purple-400" />HRV — 30 Day</CardTitle>
          </CardHeader>
          {hrvData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={hrvData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="hrv" stroke="#c084fc" fill="#c084fc" fillOpacity={0.1} strokeWidth={2} name="HRV (ms)" dot={{ r: 3, fill: '#c084fc' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
              Log HRV daily to see your trend
            </div>
          )}
        </Card>

        {/* VO2 Max */}
        <Card>
          <CardHeader>
            <CardTitle><TrendingUp className="w-4 h-4 inline mr-1 text-blue-400" />VO2 Max History</CardTitle>
            <Button size="sm" variant="secondary" onClick={() => setShowVO2Modal(true)}>
              <Plus className="w-3 h-3" /> Log
            </Button>
          </CardHeader>
          {vo2Data.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={vo2Data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="VO2 Max" stroke="#60a5fa" strokeWidth={2} dot={{ r: 4, fill: '#60a5fa' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center flex-col gap-3">
              <p className="text-slate-500 text-sm">No VO2 max entries yet</p>
              <Button size="sm" onClick={() => setShowVO2Modal(true)}>Log VO2 Max</Button>
            </div>
          )}
          {state.vo2MaxHistory.at(-1) && (
            <p className="text-xs text-slate-500 mt-2">Latest: {state.vo2MaxHistory.at(-1)?.estimatedVO2Max} ml/kg/min</p>
          )}
        </Card>
      </div>

      {/* Strength benchmarks */}
      <Card>
        <CardHeader>
          <CardTitle><Dumbbell className="w-4 h-4 inline mr-1 text-amber-400" />Strength Benchmarks vs Age-Decade Targets</CardTitle>
          <Button size="sm" variant="secondary" onClick={() => setShowBenchmarkModal(true)}>
            <Plus className="w-3 h-3" /> Update
          </Button>
        </CardHeader>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-2">
          {[
            { label: 'Grip Strength', unit: 'kg', target: benchmark.gripKg, value: latestBench?.gripStrengthKg },
            { label: 'Leg Press Ratio', unit: '×BW', target: benchmark.legPressRatio, value: latestBench?.legPressRatio },
            { label: 'Deadlift Ratio', unit: '×BW', target: benchmark.deadliftRatio, value: latestBench?.deadliftRatio },
            { label: 'Push-Ups', unit: 'reps', target: benchmark.pushUps, value: latestBench?.pushUpCount },
            { label: 'Pull-Ups', unit: 'reps', target: benchmark.pullUps, value: latestBench?.pullUpCount },
          ].map(item => {
            const pct = item.value ? Math.min(100, (item.value / item.target) * 100) : 0;
            const color = pct >= 100 ? '#00d4aa' : pct >= 75 ? '#fbbf24' : '#f43f5e';
            return (
              <div key={item.label} className="bg-slate-900 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-2">{item.label}</p>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-lg font-bold" style={{ color }}>
                    {item.value ?? '–'}
                  </span>
                  <span className="text-xs text-slate-500">{item.unit}</span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">Target: {item.target} {item.unit}</p>
                <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-slate-600 mt-3">Benchmarks for age {Math.floor(age / 10) * 10}–{Math.floor(age / 10) * 10 + 9} {profile.gender}s. Source: Peter Attia longevity protocols.</p>
      </Card>

      {/* Sleep */}
      <Card>
        <CardHeader>
          <CardTitle><Moon className="w-4 h-4 inline mr-1 text-indigo-400" />Sleep & Recovery — 30 Day</CardTitle>
        </CardHeader>
        {state.dailyLogs.filter(l => l.sleepHours).length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart
              data={state.dailyLogs.filter(l => l.sleepHours).slice(-30).map(l => ({
                date: formatDate(l.date, 'MMM d'),
                sleep: l.sleepHours,
                quality: (l.sleepQuality ?? 0) * 20, // scale 1-5 → 0-100
              }))}
              margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="sleep" stroke="#818cf8" fill="#818cf8" fillOpacity={0.1} strokeWidth={2} name="Hours" />
              <ReferenceLine y={8} stroke="#4ade80" strokeDasharray="3 3" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-32 flex items-center justify-center text-slate-500 text-sm">
            Log sleep in daily metrics to see trend
          </div>
        )}
      </Card>

      {/* Metric log modal */}
      <Modal open={showMetricModal} onClose={() => setShowMetricModal(false)} title="Log Today's Metrics" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Sleep (hours)" type="number" step="0.5" min="0" max="24"
              value={metricForm.sleepHours} onChange={e => setMetricForm(f => ({ ...f, sleepHours: e.target.value }))} />
            <div>
              <label className="label">Sleep Quality</label>
              <select value={metricForm.sleepQuality} onChange={e => setMetricForm(f => ({ ...f, sleepQuality: e.target.value }))}
                className="input-base mt-1">
                <option value="1">1 – Poor</option>
                <option value="2">2 – Fair</option>
                <option value="3">3 – Average</option>
                <option value="4">4 – Good</option>
                <option value="5">5 – Excellent</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="HRV (ms)" type="number" placeholder="e.g. 55"
              value={metricForm.hrvMs} onChange={e => setMetricForm(f => ({ ...f, hrvMs: e.target.value }))} />
            <Input label="Resting HR (bpm)" type="number"
              value={metricForm.restingHR} onChange={e => setMetricForm(f => ({ ...f, restingHR: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Mobility Score (0-100)" type="number" min="0" max="100"
              value={metricForm.mobilityScore} onChange={e => setMetricForm(f => ({ ...f, mobilityScore: e.target.value }))} />
            <div>
              <label className="label">Stress Level</label>
              <select value={metricForm.stressLevel} onChange={e => setMetricForm(f => ({ ...f, stressLevel: e.target.value }))}
                className="input-base mt-1">
                <option value="1">1 – None</option>
                <option value="2">2 – Low</option>
                <option value="3">3 – Moderate</option>
                <option value="4">4 – High</option>
                <option value="5">5 – Extreme</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Zone 2 Minutes Today" type="number"
              value={metricForm.zone2Minutes} onChange={e => setMetricForm(f => ({ ...f, zone2Minutes: e.target.value }))} />
            <Select label="Activity Type" value={metricForm.zone2ActivityType}
              onChange={e => setMetricForm(f => ({ ...f, zone2ActivityType: e.target.value as any }))}>
              <option value="run">Run</option><option value="bike">Bike</option><option value="row">Row</option>
              <option value="swim">Swim</option><option value="walk">Walk</option><option value="other">Other</option>
            </Select>
          </div>
          <Input label="Notes" value={metricForm.notes} onChange={e => setMetricForm(f => ({ ...f, notes: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setShowMetricModal(false)}>Cancel</Button>
            <Button onClick={handleSaveMetrics}>Save Metrics</Button>
          </div>
        </div>
      </Modal>

      {/* Profile modal */}
      <Modal open={showProfileModal} onClose={() => setShowProfileModal(false)} title="Your Profile" size="md">
        <div className="space-y-4">
          <Input label="Name" value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Birth Year" type="number" value={profileForm.birthYear} onChange={e => setProfileForm(f => ({ ...f, birthYear: e.target.value }))} />
            <Select label="Gender" value={profileForm.gender} onChange={e => setProfileForm(f => ({ ...f, gender: e.target.value as any }))}>
              <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Bodyweight (kg)" type="number" value={profileForm.bodyweightKg} onChange={e => setProfileForm(f => ({ ...f, bodyweightKg: e.target.value }))} />
            <Input label="Height (cm)" type="number" value={profileForm.heightCm} onChange={e => setProfileForm(f => ({ ...f, heightCm: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Weight Unit" value={profileForm.weightUnit} onChange={e => setProfileForm(f => ({ ...f, weightUnit: e.target.value as any }))}>
              <option value="kg">kg</option><option value="lbs">lbs</option>
            </Select>
            <Input label="Zone 2 Target (min/week)" type="number" value={profileForm.zone2WeeklyTargetMinutes}
              onChange={e => setProfileForm(f => ({ ...f, zone2WeeklyTargetMinutes: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setShowProfileModal(false)}>Cancel</Button>
            <Button onClick={handleSaveProfile}>Save Profile</Button>
          </div>
        </div>
      </Modal>

      {/* VO2 Max log modal */}
      <Modal open={showVO2Modal} onClose={() => setShowVO2Modal(false)} title="Log VO2 Max Estimate" size="sm">
        <div className="space-y-4">
          <Input label="VO2 Max (ml/kg/min)" type="number" step="0.1" value={vo2Form.estimatedVO2Max}
            onChange={e => setVo2Form(f => ({ ...f, estimatedVO2Max: e.target.value }))} />
          <Select label="Test Method" value={vo2Form.testMethod} onChange={e => setVo2Form(f => ({ ...f, testMethod: e.target.value as any }))}>
            <option value="manual">Manual Entry</option>
            <option value="device_sync">Device / Watch</option>
            <option value="cooper_12min">Cooper 12-min Run</option>
            <option value="rockport_1mile">Rockport 1-Mile Walk</option>
            <option value="resting_hr_estimate">Resting HR Estimate</option>
          </Select>
          <Input label="Notes" value={vo2Form.notes} onChange={e => setVo2Form(f => ({ ...f, notes: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setShowVO2Modal(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!vo2Form.estimatedVO2Max) return;
              addVO2MaxEntry({ date: todayStr(), estimatedVO2Max: Number(vo2Form.estimatedVO2Max), testMethod: vo2Form.testMethod, notes: vo2Form.notes || undefined });
              setShowVO2Modal(false);
            }}>Save</Button>
          </div>
        </div>
      </Modal>

      {/* Strength benchmark modal */}
      <Modal open={showBenchmarkModal} onClose={() => setShowBenchmarkModal(false)} title="Update Strength Benchmarks" size="sm">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Grip Strength (kg)" type="number" value={benchForm.gripStrengthKg} onChange={e => setBenchForm(f => ({ ...f, gripStrengthKg: e.target.value }))} />
            <Input label="Bodyweight (kg)" type="number" value={benchForm.bodyweightKg} onChange={e => setBenchForm(f => ({ ...f, bodyweightKg: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Leg Press / BW Ratio" type="number" step="0.1" value={benchForm.legPressRatio} onChange={e => setBenchForm(f => ({ ...f, legPressRatio: e.target.value }))} />
            <Input label="Push-Up Count" type="number" value={benchForm.pushUpCount} onChange={e => setBenchForm(f => ({ ...f, pushUpCount: e.target.value }))} />
          </div>
          <Input label="Pull-Up Count" type="number" value={benchForm.pullUpCount} onChange={e => setBenchForm(f => ({ ...f, pullUpCount: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setShowBenchmarkModal(false)}>Cancel</Button>
            <Button onClick={() => {
              addStrengthBenchmark({
                date: todayStr(),
                bodyweightKg: Number(benchForm.bodyweightKg),
                gripStrengthKg: benchForm.gripStrengthKg ? Number(benchForm.gripStrengthKg) : undefined,
                legPressRatio: benchForm.legPressRatio ? Number(benchForm.legPressRatio) : undefined,
                pushUpCount: benchForm.pushUpCount ? Number(benchForm.pushUpCount) : undefined,
                pullUpCount: benchForm.pullUpCount ? Number(benchForm.pullUpCount) : undefined,
              });
              setShowBenchmarkModal(false);
            }}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
