'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/AuthContext';
import type { WeeklyPlan, DayPlan, DayOfWeek } from '@/types/planner';
import { getMondayOfWeek } from '@/lib/utils';

function makeEmptyDays(): DayPlan[] {
  return Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i as DayOfWeek,
    templateIds: [],
    isRestDay: false,
  }));
}

function rowToPlan(row: Record<string, any>): WeeklyPlan {
  return {
    id: row.id,
    weekStartDate: String(row.week_start_date).slice(0, 10),
    days: row.days ?? makeEmptyDays(),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useWeeklyPlan() {
  const { user } = useAuth();
  const supabase = createClient();
  const [plans, setPlans] = useState<WeeklyPlan[]>([]);

  useEffect(() => {
    if (!user) { setPlans([]); return; }
    supabase
      .from('weekly_plans')
      .select('*')
      .then(({ data }) => {
        if (data) setPlans(data.map(rowToPlan));
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  function getPlanForWeek(weekStart: string): WeeklyPlan {
    const existing = plans.find(p => p.weekStartDate === weekStart);
    return existing ?? {
      id: '',
      weekStartDate: weekStart,
      days: makeEmptyDays(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async function savePlan(plan: WeeklyPlan) {
    if (!user) return;
    const { data: row } = await supabase
      .from('weekly_plans')
      .upsert(
        {
          ...(plan.id && { id: plan.id }),
          user_id: user.id,
          week_start_date: plan.weekStartDate,
          days: plan.days,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,week_start_date' }
      )
      .select()
      .single();
    if (row) {
      const updated = rowToPlan(row);
      setPlans(prev => {
        const idx = prev.findIndex(p => p.weekStartDate === plan.weekStartDate);
        if (idx >= 0) { const next = [...prev]; next[idx] = updated; return next; }
        return [...prev, updated];
      });
    }
  }

  async function addTemplateToPlan(weekStart: string, dayOfWeek: DayOfWeek, templateId: string) {
    const plan = getPlanForWeek(weekStart);
    const updatedDays = plan.days.map(d =>
      d.dayOfWeek === dayOfWeek
        ? { ...d, templateIds: d.templateIds.includes(templateId) ? d.templateIds : [...d.templateIds, templateId] }
        : d
    );
    await savePlan({ ...plan, days: updatedDays });
  }

  async function removeTemplateFromPlan(weekStart: string, dayOfWeek: DayOfWeek, templateId: string) {
    const plan = getPlanForWeek(weekStart);
    const updatedDays = plan.days.map(d =>
      d.dayOfWeek === dayOfWeek
        ? { ...d, templateIds: d.templateIds.filter(id => id !== templateId) }
        : d
    );
    await savePlan({ ...plan, days: updatedDays });
  }

  async function toggleRestDay(weekStart: string, dayOfWeek: DayOfWeek) {
    const plan = getPlanForWeek(weekStart);
    const updatedDays = plan.days.map(d =>
      d.dayOfWeek === dayOfWeek ? { ...d, isRestDay: !d.isRestDay, templateIds: [] } : d
    );
    await savePlan({ ...plan, days: updatedDays });
  }

  function getTodayTemplateIds(): string[] {
    const monday = getMondayOfWeek();
    const plan = getPlanForWeek(monday);
    const todayDOW = new Date().getDay() as DayOfWeek;
    const adjustedDOW = todayDOW === 0 ? 6 : todayDOW - 1;
    return plan.days.find(d => d.dayOfWeek === adjustedDOW)?.templateIds ?? [];
  }

  return { plans, getPlanForWeek, savePlan, addTemplateToPlan, removeTemplateFromPlan, toggleRestDay, getTodayTemplateIds };
}
