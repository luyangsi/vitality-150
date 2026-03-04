'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useExerciseLibrary } from '@/hooks/useExerciseLibrary';
import type { WorkoutTemplate, PlannedExercise } from '@/types/planner';
import type { ExerciseCategory, MuscleGroup } from '@/types/exercise';
import { uuid } from '@/lib/utils';

const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest','back','shoulders','biceps','triceps','forearms',
  'core','glutes','quads','hamstrings','calves','full_body'
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<WorkoutTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initial?: WorkoutTemplate;
}

export function TemplateEditor({ open, onClose, onSave, initial }: Props) {
  const { allExercises, searchExercises } = useExerciseLibrary();
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState<ExerciseCategory>(initial?.category ?? 'strength');
  const [duration, setDuration] = useState(initial?.estimatedDurationMinutes ?? 60);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>(initial?.targetMuscleGroups ?? []);
  const [exercises, setExercises] = useState<PlannedExercise[]>(initial?.exercises ?? []);
  const [exSearch, setExSearch] = useState('');
  const [showExSearch, setShowExSearch] = useState(false);

  function toggleMuscle(mg: MuscleGroup) {
    setMuscleGroups(prev => prev.includes(mg) ? prev.filter(m => m !== mg) : [...prev, mg]);
  }

  function addExercise(ex: { id: string; name: string }) {
    setExercises(prev => [...prev, {
      exerciseId: ex.id,
      exerciseName: ex.name,
      targetSets: 3,
      targetReps: '8-12',
    }]);
    setExSearch('');
    setShowExSearch(false);
  }

  function removeExercise(idx: number) {
    setExercises(prev => prev.filter((_, i) => i !== idx));
  }

  function updateExercise(idx: number, updates: Partial<PlannedExercise>) {
    setExercises(prev => prev.map((e, i) => i === idx ? { ...e, ...updates } : e));
  }

  function handleSave() {
    if (!name.trim()) return;
    onSave({ name: name.trim(), category, estimatedDurationMinutes: duration, targetMuscleGroups: muscleGroups, exercises, tags: [] });
    setName(''); setCategory('strength'); setDuration(60); setMuscleGroups([]); setExercises([]);
  }

  const searchResults = exSearch.length > 0 ? searchExercises(exSearch).slice(0, 6) : [];

  return (
    <Modal open={open} onClose={onClose} title="New Workout Template" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Template Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Upper Strength A" />
          <Select label="Category" value={category} onChange={e => setCategory(e.target.value as ExerciseCategory)}>
            <option value="strength">Strength</option>
            <option value="cardio">Cardio</option>
            <option value="mobility">Mobility</option>
            <option value="plyometric">Plyometric</option>
            <option value="isometric">Isometric</option>
          </Select>
        </div>

        <Input label="Estimated Duration (min)" type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} />

        {/* Muscle groups */}
        <div>
          <p className="label mb-2">Target Muscle Groups</p>
          <div className="flex flex-wrap gap-2">
            {MUSCLE_GROUPS.map(mg => (
              <button
                key={mg}
                onClick={() => toggleMuscle(mg)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                  muscleGroups.includes(mg)
                    ? 'bg-vitality-500/15 border-vitality-500/40 text-vitality-400'
                    : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500'
                }`}
              >
                {mg.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Exercises */}
        <div>
          <p className="label mb-2">Exercises ({exercises.length})</p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {exercises.map((ex, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-700 rounded-lg p-3 flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm text-slate-200">{ex.exerciseName}</p>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="number"
                      value={ex.targetSets}
                      onChange={e => updateExercise(idx, { targetSets: Number(e.target.value) })}
                      className="w-14 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-300"
                      placeholder="Sets"
                    />
                    <input
                      type="text"
                      value={ex.targetReps}
                      onChange={e => updateExercise(idx, { targetReps: e.target.value })}
                      className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-300"
                      placeholder="Reps"
                    />
                  </div>
                </div>
                <button onClick={() => removeExercise(idx)} className="text-rose-400 hover:text-rose-300">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Exercise search */}
          <div className="mt-2 relative">
            <Input
              placeholder="Search exercises to add..."
              value={exSearch}
              onChange={e => { setExSearch(e.target.value); setShowExSearch(true); }}
              onFocus={() => setShowExSearch(true)}
            />
            {showExSearch && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-slate-900 border border-slate-700 rounded-lg mt-1 z-10 shadow-xl">
                {searchResults.map(ex => (
                  <button
                    key={ex.id}
                    onClick={() => addExercise({ id: ex.id, name: ex.name })}
                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-slate-100 first:rounded-t-lg last:rounded-b-lg"
                  >
                    {ex.name}
                    <span className="text-xs text-slate-500 ml-2">{ex.category}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>Save Template</Button>
        </div>
      </div>
    </Modal>
  );
}
