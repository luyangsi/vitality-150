'use client';

import { useRouter } from 'next/navigation';
import { Zap, List, PlusCircle } from 'lucide-react';
import { useTemplates } from '@/hooks/useTemplates';
import { useWeeklyPlan } from '@/hooks/useWeeklyPlan';
import { useActiveSession } from '@/hooks/useActiveSession';
import { useWorkoutSessions } from '@/hooks/useWorkoutSessions';
import { getMondayOfWeek, uuid } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import type { WorkoutSession } from '@/types/session';

export default function LogPage() {
  const router = useRouter();
  const { templates } = useTemplates();
  const { getTodayTemplateIds } = useWeeklyPlan();
  const { session: activeSession, startSession, discardSession } = useActiveSession();
  const { addSession } = useWorkoutSessions();

  const todayTemplateIds = getTodayTemplateIds();
  const todayTemplates = templates.filter(t => todayTemplateIds.includes(t.id));

  function beginSession(name: string, templateId?: string) {
    const session: WorkoutSession = {
      id: uuid(),
      name,
      templateId,
      date: new Date().toISOString().slice(0, 10),
      startTime: new Date().toISOString(),
      status: 'in_progress',
      exercises: [],
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    startSession(session);
    router.push(`/log/${session.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Log Workout</h1>
        <p className="text-slate-400 text-sm mt-1">Start a session from your plan or create a custom one.</p>
      </div>

      {/* Active session recovery */}
      {activeSession && (
        <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <p className="text-amber-400 font-semibold text-sm">Session in progress: {activeSession.name}</p>
          <p className="text-slate-400 text-xs mt-1">You have an unfinished session. Resume or discard it.</p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={() => router.push(`/log/${activeSession.id}`)}>Resume</Button>
            <Button size="sm" variant="danger" onClick={discardSession}>Discard</Button>
          </div>
        </div>
      )}

      {/* Today's plan */}
      {todayTemplates.length > 0 && (
        <Card className="mb-4">
          <CardHeader><CardTitle>Today's Plan</CardTitle></CardHeader>
          <div className="space-y-2">
            {todayTemplates.map(t => (
              <div key={t.id} className="flex items-center justify-between bg-slate-900 rounded-lg p-3">
                <div>
                  <p className="text-sm font-medium text-slate-200">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.estimatedDurationMinutes}min · {t.exercises.length} exercises</p>
                </div>
                <Button size="sm" onClick={() => beginSession(t.name, t.id)}>
                  <Zap className="w-3.5 h-3.5" /> Start
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* All templates */}
      <Card className="mb-4">
        <CardHeader><CardTitle><List className="w-4 h-4 inline mr-1" />Template Library</CardTitle></CardHeader>
        {templates.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">No templates yet. Create one in the Planner.</p>
        ) : (
          <div className="space-y-2">
            {templates.map(t => (
              <div key={t.id} className="flex items-center justify-between bg-slate-900 rounded-lg p-3">
                <div>
                  <p className="text-sm font-medium text-slate-200">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.estimatedDurationMinutes}min · {t.category}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => beginSession(t.name, t.id)}>Start</Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Empty session */}
      <button
        onClick={() => beginSession('Quick Workout')}
        className="w-full border-2 border-dashed border-slate-700 hover:border-vitality-500/50 rounded-xl p-6 flex flex-col items-center gap-2 text-slate-500 hover:text-vitality-500 transition-colors group"
      >
        <PlusCircle className="w-8 h-8 group-hover:text-vitality-500" />
        <span className="text-sm font-medium">Start Empty Session</span>
        <span className="text-xs text-slate-600">Add exercises as you go</span>
      </button>
    </div>
  );
}
