'use client';

import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import type { WeeklyPlan, DayPlan, DayOfWeek } from '@/types/planner';
import { getMondayOfWeek, uuid } from '@/lib/utils';
import { addDays, parseISO, format } from 'date-fns';

function makeEmptyDays(): DayPlan[] {
  return Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i as DayOfWeek,
    templateIds: [],
    isRestDay: false,
  }));
}

export function useWeeklyPlan() {
  const [plans, setPlans] = useLocalStorage<WeeklyPlan[]>(STORAGE_KEYS.WEEKLY_PLANS, []);

  function getPlanForWeek(weekStart: string): WeeklyPlan {
    const existing = plans.find(p => p.weekStartDate === weekStart);
    if (existing) return existing;
    return {
      id: uuid(),
      weekStartDate: weekStart,
      days: makeEmptyDays(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  function savePlan(plan: WeeklyPlan) {
    setPlans(prev => {
      const idx = prev.findIndex(p => p.weekStartDate === plan.weekStartDate);
      const updated = { ...plan, updatedAt: new Date().toISOString() };
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return [...prev, updated];
    });
  }

  function addTemplateToPlan(weekStart: string, dayOfWeek: DayOfWeek, templateId: string) {
    const plan = getPlanForWeek(weekStart);
    const updatedDays = plan.days.map(d =>
      d.dayOfWeek === dayOfWeek
        ? { ...d, templateIds: d.templateIds.includes(templateId) ? d.templateIds : [...d.templateIds, templateId] }
        : d
    );
    savePlan({ ...plan, days: updatedDays });
  }

  function removeTemplateFromPlan(weekStart: string, dayOfWeek: DayOfWeek, templateId: string) {
    const plan = getPlanForWeek(weekStart);
    const updatedDays = plan.days.map(d =>
      d.dayOfWeek === dayOfWeek
        ? { ...d, templateIds: d.templateIds.filter(id => id !== templateId) }
        : d
    );
    savePlan({ ...plan, days: updatedDays });
  }

  function toggleRestDay(weekStart: string, dayOfWeek: DayOfWeek) {
    const plan = getPlanForWeek(weekStart);
    const updatedDays = plan.days.map(d =>
      d.dayOfWeek === dayOfWeek ? { ...d, isRestDay: !d.isRestDay, templateIds: [] } : d
    );
    savePlan({ ...plan, days: updatedDays });
  }

  function getTodayTemplateIds(): string[] {
    const monday = getMondayOfWeek();
    const plan = getPlanForWeek(monday);
    const todayDOW = new Date().getDay() as DayOfWeek;
    // dayOfWeek 0=Sunday, but our week starts Monday (1), so map correctly
    // Monday=0 in our days array, Sunday=6
    const adjustedDOW = todayDOW === 0 ? 6 : todayDOW - 1;
    return plan.days.find(d => d.dayOfWeek === adjustedDOW)?.templateIds ?? [];
  }

  return { plans, getPlanForWeek, savePlan, addTemplateToPlan, removeTemplateFromPlan, toggleRestDay, getTodayTemplateIds };
}
