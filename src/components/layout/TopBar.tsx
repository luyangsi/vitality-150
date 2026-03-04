'use client';

import { format } from 'date-fns';
import { Flame } from 'lucide-react';
import { useWorkoutSessions } from '@/hooks/useWorkoutSessions';
import { useStreaks } from '@/hooks/useStreaks';

export function TopBar() {
  const { sessions } = useWorkoutSessions();
  const { currentStreak } = useStreaks(sessions);

  return (
    <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-950/80 backdrop-blur-sm sticky top-0 z-30">
      <p className="text-slate-400 text-sm">
        {format(new Date(), 'EEEE, MMMM d, yyyy')}
      </p>
      {currentStreak > 0 && (
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5">
          <Flame className="w-4 h-4 text-amber-400" />
          <span className="text-amber-400 font-mono font-semibold text-sm">{currentStreak}</span>
          <span className="text-slate-400 text-xs">day streak</span>
        </div>
      )}
    </header>
  );
}
