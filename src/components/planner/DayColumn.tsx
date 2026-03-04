'use client';

import { useState } from 'react';
import { Plus, Coffee, X } from 'lucide-react';
import { format, parseISO, isToday } from 'date-fns';
import type { DayPlan } from '@/types/planner';
import type { WorkoutTemplate } from '@/types/planner';
import { cn } from '@/lib/utils';
import { MUSCLE_GROUP_COLORS } from '@/types/exercise';

interface DayColumnProps {
  dayName: string;
  date: string;
  dayPlan: DayPlan;
  templates: WorkoutTemplate[];
  onAddTemplate: (templateId: string) => void;
  onRemoveTemplate: (templateId: string) => void;
  onToggleRest: () => void;
}

export function DayColumn({ dayName, date, dayPlan, templates, onAddTemplate, onRemoveTemplate, onToggleRest }: DayColumnProps) {
  const [showPicker, setShowPicker] = useState(false);
  const today = isToday(parseISO(date));
  const assignedTemplates = templates.filter(t => dayPlan.templateIds.includes(t.id));
  const unassigned = templates.filter(t => !dayPlan.templateIds.includes(t.id));

  return (
    <div className={cn(
      'bg-slate-800 border rounded-xl p-3 flex flex-col min-h-[280px] transition-colors',
      today ? 'border-vitality-500/40 shadow-vitality' : 'border-slate-700'
    )}>
      {/* Header */}
      <div className="mb-3">
        <p className={cn('text-xs font-semibold uppercase tracking-wider', today ? 'text-vitality-500' : 'text-slate-400')}>
          {dayName}
        </p>
        <p className={cn('text-lg font-bold', today ? 'text-vitality-400' : 'text-slate-300')}>
          {format(parseISO(date), 'd')}
        </p>
      </div>

      {/* Rest day */}
      {dayPlan.isRestDay ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <Coffee className="w-6 h-6 text-slate-600" />
          <span className="text-xs text-slate-500">Rest Day</span>
          <button onClick={onToggleRest} className="text-xs text-vitality-500 hover:text-vitality-400">Remove</button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-2">
          {/* Assigned templates */}
          {assignedTemplates.map(t => (
            <div key={t.id} className="bg-slate-900 border border-slate-700 rounded-lg p-2 group relative">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-200 truncate">{t.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{t.estimatedDurationMinutes}min</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {t.targetMuscleGroups.slice(0, 3).map(mg => (
                      <span
                        key={mg}
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: MUSCLE_GROUP_COLORS[mg] }}
                        title={mg}
                      />
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => onRemoveTemplate(t.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}

          {/* Add workout button */}
          <div className="mt-auto">
            {showPicker ? (
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-2">
                <p className="text-xs text-slate-400 mb-2">Add workout:</p>
                {unassigned.length === 0 ? (
                  <p className="text-xs text-slate-600">No more templates</p>
                ) : (
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {unassigned.map(t => (
                      <button
                        key={t.id}
                        onClick={() => { onAddTemplate(t.id); setShowPicker(false); }}
                        className="w-full text-left text-xs text-slate-300 hover:text-vitality-500 py-1 truncate"
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                )}
                <button onClick={() => setShowPicker(false)} className="text-xs text-slate-500 mt-2 hover:text-slate-300">Cancel</button>
              </div>
            ) : (
              <div className="flex gap-1">
                <button
                  onClick={() => setShowPicker(true)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-slate-500 hover:text-vitality-500 border border-dashed border-slate-700 hover:border-vitality-500/40 rounded-lg transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
                <button
                  onClick={onToggleRest}
                  className="px-2 py-1.5 text-xs text-slate-600 hover:text-slate-400 border border-dashed border-slate-700 rounded-lg transition-colors"
                  title="Mark as rest day"
                >
                  <Coffee className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
