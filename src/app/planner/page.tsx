'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format, parseISO, addWeeks, subWeeks, addDays } from 'date-fns';
import { useWeeklyPlan } from '@/hooks/useWeeklyPlan';
import { useTemplates } from '@/hooks/useTemplates';
import { getMondayOfWeek, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { DayColumn } from '@/components/planner/DayColumn';
import { TemplateEditor } from '@/components/planner/TemplateEditor';
import type { DayOfWeek } from '@/types/planner';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function PlannerPage() {
  const [weekStart, setWeekStart] = useState(getMondayOfWeek());
  const [showEditor, setShowEditor] = useState(false);
  const { getPlanForWeek, addTemplateToPlan, removeTemplateFromPlan, toggleRestDay, savePlan } = useWeeklyPlan();
  const { templates, addTemplate, updateTemplate, deleteTemplate } = useTemplates();

  const plan = getPlanForWeek(weekStart);
  const weekDates = Array.from({ length: 7 }, (_, i) =>
    format(addDays(parseISO(weekStart), i), 'yyyy-MM-dd')
  );

  function prevWeek() { setWeekStart(format(subWeeks(parseISO(weekStart), 1), 'yyyy-MM-dd')); }
  function nextWeek() { setWeekStart(format(addWeeks(parseISO(weekStart), 1), 'yyyy-MM-dd')); }
  function goToday() { setWeekStart(getMondayOfWeek()); }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Weekly Planner</h1>
          <p className="text-gray-500 text-sm mt-1">
            {formatDate(weekStart, 'MMM d')} – {formatDate(format(addDays(parseISO(weekStart), 6), 'yyyy-MM-dd'), 'MMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={prevWeek}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="secondary" size="sm" onClick={goToday}>Today</Button>
          <Button variant="secondary" size="sm" onClick={nextWeek}><ChevronRight className="w-4 h-4" /></Button>
          <Button onClick={() => setShowEditor(true)}>
            <Plus className="w-4 h-4" /> New Template
          </Button>
        </div>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-7 gap-3">
        {Array.from({ length: 7 }, (_, i) => {
          const dayPlan = plan.days.find(d => d.dayOfWeek === i) ?? { dayOfWeek: i as DayOfWeek, templateIds: [], isRestDay: false };
          const date = weekDates[i];
          return (
            <DayColumn
              key={i}
              dayName={DAY_NAMES[i]}
              date={date}
              dayPlan={dayPlan}
              templates={templates}
              onAddTemplate={(templateId) => addTemplateToPlan(weekStart, i as DayOfWeek, templateId)}
              onRemoveTemplate={(templateId) => removeTemplateFromPlan(weekStart, i as DayOfWeek, templateId)}
              onToggleRest={() => toggleRestDay(weekStart, i as DayOfWeek)}
            />
          );
        })}
      </div>

      {/* Template library summary */}
      {templates.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Template Library</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {templates.map(t => (
              <div key={t.id} className="bg-gray-100 border border-gray-200 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-800 truncate">{t.name}</p>
                <p className="text-xs text-gray-500 mt-1">{t.estimatedDurationMinutes}min · {t.exercises.length} exercises</p>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => deleteTemplate(t.id)} className="text-xs text-red-500 hover:text-red-600">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Template editor modal */}
      <TemplateEditor
        open={showEditor}
        onClose={() => setShowEditor(false)}
        onSave={(data) => { addTemplate(data); setShowEditor(false); }}
      />
    </div>
  );
}
