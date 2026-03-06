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
      'bg-white border rounded-xl p-3 flex flex-col min-h-[280px] transition-colors shadow-card',
      today ? 'border-vitality-300' : 'border-gray-200'
    )}>
      {/* Header */}
      <div className="mb-3">
        <p className={cn('text-xs font-semibold uppercase tracking-wider', today ? 'text-vitality-600' : 'text-gray-400')}>
          {dayName}
        </p>
        <p className={cn('text-lg font-bold', today ? 'text-vitality-600' : 'text-gray-700')}>
          {format(parseISO(date), 'd')}
        </p>
      </div>

      {/* Rest day */}
      {dayPlan.isRestDay ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <Coffee className="w-6 h-6 text-gray-300" />
          <span className="text-xs text-gray-400">Rest Day</span>
          <button onClick={onToggleRest} className="text-xs text-vitality-600 hover:text-vitality-700">Remove</button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-2">
          {/* Assigned templates */}
          {assignedTemplates.map(t => (
            <div key={t.id} className="bg-gray-50 border border-gray-200 rounded-lg p-2 group relative">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{t.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.estimatedDurationMinutes}min</p>
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
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}

          {/* Add workout button */}
          <div className="mt-auto">
            {showPicker ? (
              <div className="bg-white border border-gray-200 rounded-lg p-2 shadow-card">
                <p className="text-xs text-gray-500 mb-2">Add workout:</p>
                {unassigned.length === 0 ? (
                  <p className="text-xs text-gray-400">No more templates</p>
                ) : (
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {unassigned.map(t => (
                      <button
                        key={t.id}
                        onClick={() => { onAddTemplate(t.id); setShowPicker(false); }}
                        className="w-full text-left text-xs text-gray-700 hover:text-vitality-600 py-1 truncate"
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                )}
                <button onClick={() => setShowPicker(false)} className="text-xs text-gray-400 mt-2 hover:text-gray-600">Cancel</button>
              </div>
            ) : (
              <div className="flex gap-1">
                <button
                  onClick={() => setShowPicker(true)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-gray-400 hover:text-vitality-600 border border-dashed border-gray-200 hover:border-vitality-300 rounded-lg transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
                <button
                  onClick={onToggleRest}
                  className="px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600 border border-dashed border-gray-200 rounded-lg transition-colors"
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
