'use client';

import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import type { WorkoutTemplate } from '@/types/planner';
import { uuid } from '@/lib/utils';

export function useTemplates() {
  const [templates, setTemplates] = useLocalStorage<WorkoutTemplate[]>(STORAGE_KEYS.TEMPLATES, []);

  function addTemplate(data: Omit<WorkoutTemplate, 'id' | 'createdAt' | 'updatedAt'>): WorkoutTemplate {
    const template: WorkoutTemplate = {
      ...data,
      id: uuid(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTemplates(prev => [...prev, template]);
    return template;
  }

  function updateTemplate(id: string, updates: Partial<WorkoutTemplate>) {
    setTemplates(prev =>
      prev.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t)
    );
  }

  function deleteTemplate(id: string) {
    setTemplates(prev => prev.filter(t => t.id !== id));
  }

  function getTemplateById(id: string): WorkoutTemplate | undefined {
    return templates.find(t => t.id === id);
  }

  return { templates, addTemplate, updateTemplate, deleteTemplate, getTemplateById };
}
