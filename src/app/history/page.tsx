'use client';

import { useState } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Trophy, Clock, Dumbbell, X } from 'lucide-react';
import { useWorkoutSessions } from '@/hooks/useWorkoutSessions';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { MUSCLE_GROUP_COLORS } from '@/types/exercise';
import type { WorkoutSession } from '@/types/session';
import { cn, formatDate, formatDuration } from '@/lib/utils';

export default function HistoryPage() {
  const { sessions, deleteSession } = useWorkoutSessions();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd   = endOfMonth(currentMonth);
  const days       = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad start
  const startDOW = (monthStart.getDay() + 6) % 7; // Mon-based
  const paddedDays = Array(startDOW).fill(null).concat(days);

  function getSessionsForDate(date: Date): WorkoutSession[] {
    const dateStr = format(date, 'yyyy-MM-dd');
    return sessions.filter(s => s.date === dateStr && s.status === 'completed');
  }

  const selectedDateSessions = selectedDate
    ? sessions.filter(s => s.date === selectedDate && s.status === 'completed')
    : [];

  const completedSessions = sessions.filter(s => s.status === 'completed');

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">History</h1>
        <p className="text-gray-500 text-sm mt-1">{completedSessions.length} sessions logged</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))}
                className="text-gray-400 hover:text-gray-700 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="font-semibold text-gray-900">{format(currentMonth, 'MMMM yyyy')}</h2>
              <button onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))}
                className="text-gray-400 hover:text-gray-700 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                <div key={d} className="text-center text-xs text-gray-500 font-medium py-1">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1">
              {paddedDays.map((day, idx) => {
                if (!day) return <div key={idx} />;
                const daySessions = getSessionsForDate(day);
                const dateStr = format(day, 'yyyy-MM-dd');
                const isSelected = selectedDate === dateStr;
                const today = isToday(day);
                const inMonth = isSameMonth(day, currentMonth);

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                    className={cn(
                      'relative aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all',
                      !inMonth && 'opacity-30',
                      isSelected && 'bg-vitality-500/15 border border-vitality-500/40',
                      !isSelected && daySessions.length > 0 && 'bg-vitality-50 hover:bg-vitality-100',
                      !isSelected && daySessions.length === 0 && 'hover:bg-gray-50',
                      today && 'ring-1 ring-vitality-500/40'
                    )}
                  >
                    <span className={cn(
                      'text-xs font-medium',
                      today ? 'text-vitality-400' : inMonth ? 'text-gray-700' : 'text-slate-600'
                    )}>
                      {format(day, 'd')}
                    </span>
                    {daySessions.length > 0 && (
                      <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                        {daySessions.slice(0, 3).map(s => (
                          <span
                            key={s.id}
                            className="w-1.5 h-1.5 rounded-full bg-vitality-500"
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Session list for selected date / recent */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDate ? formatDate(selectedDate, 'MMM d') : 'Recent Sessions'}
              </CardTitle>
              {selectedDate && (
                <button onClick={() => setSelectedDate(null)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-4 h-4" />
                </button>
              )}
            </CardHeader>
            <div className="space-y-2">
              {(selectedDate ? selectedDateSessions : completedSessions.slice(0, 10)).map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSession(s)}
                  className="w-full text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-3 transition-colors group"
                >
                  <p className="text-sm font-medium text-gray-800 group-hover:text-vitality-400 truncate">{s.name}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    {!selectedDate && <span>{formatDate(s.date, 'MMM d')}</span>}
                    {s.durationMinutes && (
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDuration(s.durationMinutes)}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Dumbbell className="w-3 h-3" />
                      {s.exercises.flatMap(e => e.sets.filter(st => !st.isWarmup)).length} sets
                    </span>
                    {s.exercises.flatMap(e => e.sets).some(st => st.isPR) && (
                      <Trophy className="w-3 h-3 text-amber-600" />
                    )}
                  </div>
                </button>
              ))}
              {(selectedDate ? selectedDateSessions : completedSessions).length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">No sessions</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Session detail modal */}
      {selectedSession && (
        <Modal open={!!selectedSession} onClose={() => setSelectedSession(null)} title={selectedSession.name} size="lg">
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{formatDate(selectedSession.date)}</span>
              {selectedSession.durationMinutes && <span>{formatDuration(selectedSession.durationMinutes)}</span>}
            </div>

            {/* PRs */}
            {selectedSession.exercises.flatMap(e => e.sets).some(s => s.isPR) && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <p className="text-amber-600 text-xs font-semibold flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5" /> Personal Records
                </p>
                <div className="mt-2 space-y-1">
                  {selectedSession.exercises.flatMap(e =>
                    e.sets.filter(s => s.isPR).map(s => (
                      <p key={s.id} className="text-xs text-gray-700">
                        {e.exerciseName}: {s.weight}kg × {s.reps}
                      </p>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Exercise breakdown */}
            <div className="space-y-3">
              {selectedSession.exercises.map(ex => (
                <div key={ex.id} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-800 mb-2">{ex.exerciseName}</p>
                  <div className="grid grid-cols-4 gap-2 text-xs text-gray-500 mb-1">
                    <span>Set</span><span>Weight</span><span>Reps</span><span>RPE</span>
                  </div>
                  {ex.sets.map((set, idx) => (
                    <div key={set.id} className="grid grid-cols-4 gap-2 text-xs text-gray-700 py-0.5">
                      <span>{set.isWarmup ? 'W' : idx + 1}{set.isPR && ' 🏆'}</span>
                      <span>{set.weight}kg</span>
                      <span>{set.reps}</span>
                      <span>{set.rpe ?? '–'}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {selectedSession.notes && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Notes</p>
                <p className="text-sm text-gray-700">{selectedSession.notes}</p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="danger" size="sm" onClick={() => { deleteSession(selectedSession.id); setSelectedSession(null); }}>
                Delete Session
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
