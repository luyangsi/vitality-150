'use client';

import { useState, useMemo } from 'react';
import { Search, Plus, Check } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { useExerciseLibrary } from '@/hooks/useExerciseLibrary';
import { useTemplates } from '@/hooks/useTemplates';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { MUSCLE_GROUP_COLORS } from '@/types/exercise';
import type { Exercise, MuscleGroup, ExerciseCategory, EquipmentType } from '@/types/exercise';
import type { WorkoutTemplate } from '@/types/planner';

// ─── Movement pattern derivation ─────────────────────────────────────────────

type MovementPattern = 'Push' | 'Pull' | 'Hinge' | 'Squat' | 'Core' | 'Cardio' | 'Mobility' | 'Other';

const PATTERN_COLORS: Record<MovementPattern, string> = {
  Push:     '#60a5fa',
  Pull:     '#f97316',
  Hinge:    '#a855f7',
  Squat:    '#22c55e',
  Core:     '#eab308',
  Cardio:   '#22d3ee',
  Mobility: '#ec4899',
  Other:    '#9ca3af',
};

function getMovementPattern(ex: Exercise): MovementPattern {
  if (ex.category === 'cardio')   return 'Cardio';
  if (ex.category === 'mobility') return 'Mobility';
  const p = ex.primaryMuscles;
  if (p.includes('chest') || p.includes('triceps') || (p.includes('shoulders') && !p.includes('back'))) return 'Push';
  if (p.includes('back')  || p.includes('biceps'))   return 'Pull';
  if (p.includes('quads'))                            return 'Squat';
  if (p.includes('glutes') || p.includes('hamstrings')) return 'Hinge';
  if (p.includes('core'))                             return 'Core';
  return 'Other';
}

// ─── Filter constants ─────────────────────────────────────────────────────────

const CATEGORIES: ExerciseCategory[] = ['strength', 'cardio', 'mobility', 'plyometric', 'isometric'];
const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'core', 'glutes', 'quads', 'hamstrings', 'calves', 'full_body',
];
const EQUIPMENT: EquipmentType[] = ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'kettlebell', 'bands', 'none'];

const TOOLTIP_STYLE = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: '8px',
  fontSize: '12px',
  color: '#1F2937',
};

// ─── Subcomponents ────────────────────────────────────────────────────────────

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors whitespace-nowrap ${
        active
          ? 'bg-vitality-50 border-vitality-300 text-vitality-700'
          : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
      }`}
    >
      {label}
    </button>
  );
}

function ExerciseCard({ exercise, onAdd }: { exercise: Exercise; onAdd: (ex: Exercise) => void }) {
  const pattern = getMovementPattern(exercise);
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 hover:border-gray-300 transition-colors shadow-card">
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-gray-900 leading-snug">{exercise.name}</p>
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0"
            style={{ backgroundColor: PATTERN_COLORS[pattern] + '20', color: PATTERN_COLORS[pattern] }}
          >
            {pattern}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5 capitalize">
          {exercise.category} · {exercise.equipment.replace('_', ' ')}
        </p>
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {exercise.primaryMuscles.map(mg => (
            <span
              key={mg}
              className="inline-flex items-center gap-1 text-[10px] text-gray-600 bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5"
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: MUSCLE_GROUP_COLORS[mg] }} />
              {mg.replace('_', ' ')}
            </span>
          ))}
        </div>
      </div>
      <button
        onClick={() => onAdd(exercise)}
        className="flex items-center justify-center gap-1.5 w-full py-1.5 text-xs font-medium text-vitality-700 bg-vitality-50 hover:bg-vitality-100 border border-vitality-200 rounded-lg transition-colors"
      >
        <Plus className="w-3 h-3" /> Add to Template
      </button>
    </div>
  );
}

// ─── Add to Template Modal ────────────────────────────────────────────────────

function AddToTemplateModal({
  exercise,
  templates,
  onClose,
  onAdd,
}: {
  exercise: Exercise | null;
  templates: WorkoutTemplate[];
  onClose: () => void;
  onAdd: (templateId: string) => void;
}) {
  const [added, setAdded] = useState<string | null>(null);

  function handleAdd(templateId: string) {
    onAdd(templateId);
    setAdded(templateId);
    setTimeout(onClose, 800);
  }

  return (
    <Modal open={!!exercise} onClose={onClose} title={`Add "${exercise?.name}" to…`} size="sm">
      {templates.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">No templates yet.</p>
          <p className="text-xs text-gray-400 mt-1">Create one in the Planner first.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map(t => {
            const alreadyHas = t.exercises.some(e => e.exerciseId === exercise?.id);
            const isAdded = added === t.id;
            return (
              <button
                key={t.id}
                disabled={alreadyHas || isAdded}
                onClick={() => handleAdd(t.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                  alreadyHas || isAdded
                    ? 'bg-gray-50 border-gray-100 text-gray-400 cursor-default'
                    : 'bg-white border-gray-200 text-gray-800 hover:border-vitality-300 hover:bg-vitality-50'
                }`}
              >
                <div className="text-left">
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.exercises.length} exercises · {t.estimatedDurationMinutes}min</p>
                </div>
                {(alreadyHas || isAdded) && <Check className="w-4 h-4 text-vitality-500" />}
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MovementsPage() {
  const { allExercises } = useExerciseLibrary();
  const { templates, updateTemplate, getTemplateById } = useTemplates();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ExerciseCategory | 'all'>('all');
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | 'all'>('all');
  const [equipmentFilter, setEquipmentFilter] = useState<EquipmentType | 'all'>('all');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  // Filter exercises
  const filtered = useMemo(() => {
    return allExercises.filter(ex => {
      if (categoryFilter !== 'all' && ex.category !== categoryFilter) return false;
      if (muscleFilter !== 'all' && !ex.primaryMuscles.includes(muscleFilter) && !ex.secondaryMuscles.includes(muscleFilter)) return false;
      if (equipmentFilter !== 'all' && ex.equipment !== equipmentFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return ex.name.toLowerCase().includes(q) ||
          ex.primaryMuscles.some(m => m.includes(q)) ||
          ex.category.includes(q);
      }
      return true;
    });
  }, [allExercises, categoryFilter, muscleFilter, equipmentFilter, search]);

  // Movement balance chart — count patterns across all template exercises
  const patternCounts = useMemo(() => {
    const counts: Record<MovementPattern, number> = {
      Push: 0, Pull: 0, Hinge: 0, Squat: 0, Core: 0, Cardio: 0, Mobility: 0, Other: 0,
    };
    const exerciseMap = new Map(allExercises.map(e => [e.id, e]));
    for (const t of templates) {
      for (const pe of t.exercises) {
        const ex = exerciseMap.get(pe.exerciseId);
        if (ex) counts[getMovementPattern(ex)]++;
      }
    }
    return (Object.entries(counts) as [MovementPattern, number][])
      .filter(([, count]) => count > 0)
      .map(([pattern, count]) => ({ pattern, count, fill: PATTERN_COLORS[pattern] }));
  }, [allExercises, templates]);

  async function handleAddToTemplate(templateId: string) {
    if (!selectedExercise) return;
    const template = getTemplateById(templateId);
    if (!template) return;
    const newExercise = {
      exerciseId: selectedExercise.id,
      exerciseName: selectedExercise.name,
      targetSets: 3,
      targetReps: '8-12',
    };
    await updateTemplate(templateId, {
      exercises: [...template.exercises, newExercise],
    });
  }

  const totalInPlan = patternCounts.reduce((s, { count }) => s + count, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Movement Database</h1>
          <p className="text-gray-500 text-sm mt-1">{allExercises.length} exercises · browse, filter, and add to your plan</p>
        </div>
      </div>

      {/* Plan Coverage Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Movement Balance in Your Plan</CardTitle>
          {totalInPlan > 0 && (
            <span className="text-xs text-gray-400">{totalInPlan} exercises across all templates</span>
          )}
        </CardHeader>
        {patternCounts.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            Create templates in the Planner to see your movement balance here.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={patternCounts} barSize={32} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis dataKey="pattern" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#F3F4F6' }} />
              <Bar dataKey="count" name="Exercises" radius={[4, 4, 0, 0]}>
                {patternCounts.map(({ pattern, fill }) => (
                  <Cell key={pattern} fill={fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search exercises..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-vitality-300 focus:border-vitality-300"
          />
        </div>

        {/* Category filter */}
        <div>
          <p className="text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">Category</p>
          <div className="flex flex-wrap gap-1.5">
            <FilterPill label="All" active={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')} />
            {CATEGORIES.map(c => (
              <FilterPill key={c} label={c.charAt(0).toUpperCase() + c.slice(1)} active={categoryFilter === c} onClick={() => setCategoryFilter(c)} />
            ))}
          </div>
        </div>

        {/* Muscle filter */}
        <div>
          <p className="text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">Muscle Group</p>
          <div className="flex flex-wrap gap-1.5">
            <FilterPill label="All" active={muscleFilter === 'all'} onClick={() => setMuscleFilter('all')} />
            {MUSCLE_GROUPS.map(mg => (
              <button
                key={mg}
                onClick={() => setMuscleFilter(muscleFilter === mg ? 'all' : mg)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                  muscleFilter === mg
                    ? 'border-transparent text-white'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
                style={muscleFilter === mg ? { backgroundColor: MUSCLE_GROUP_COLORS[mg] } : {}}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: MUSCLE_GROUP_COLORS[mg] }} />
                {mg.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Equipment filter */}
        <div>
          <p className="text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">Equipment</p>
          <div className="flex flex-wrap gap-1.5">
            <FilterPill label="All" active={equipmentFilter === 'all'} onClick={() => setEquipmentFilter('all')} />
            {EQUIPMENT.map(eq => (
              <FilterPill key={eq} label={eq.charAt(0).toUpperCase() + eq.slice(1)} active={equipmentFilter === eq} onClick={() => setEquipmentFilter(eq)} />
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-400">{filtered.length} exercise{filtered.length !== 1 ? 's' : ''} found</p>

      {/* Exercise grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">No exercises match your filters.</p>
          <button onClick={() => { setSearch(''); setCategoryFilter('all'); setMuscleFilter('all'); setEquipmentFilter('all'); }} className="text-xs text-vitality-600 mt-2 hover:underline">
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(ex => (
            <ExerciseCard key={ex.id} exercise={ex} onAdd={setSelectedExercise} />
          ))}
        </div>
      )}

      {/* Add to Template modal */}
      <AddToTemplateModal
        exercise={selectedExercise}
        templates={templates}
        onClose={() => setSelectedExercise(null)}
        onAdd={handleAddToTemplate}
      />
    </div>
  );
}
