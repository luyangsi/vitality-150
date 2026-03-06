'use client';

import { format } from 'date-fns';
import { Flame } from 'lucide-react';
import { useWorkoutSessions } from '@/hooks/useWorkoutSessions';
import { useStreaks } from '@/hooks/useStreaks';

export function TopBar() {
  const { sessions } = useWorkoutSessions();
  const { currentStreak } = useStreaks(sessions);

  return (
    <header className="h-16 border-b border-gray-100 px-6 flex items-center justify-between bg-white sticky top-0 z-30">
      <p className="text-gray-500 text-sm">
        {format(new Date(), 'EEEE, MMMM d, yyyy')}
      </p>
      {currentStreak > 0 && (
        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
          <Flame className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-amber-700 font-semibold text-sm">{currentStreak}</span>
          <span className="text-amber-500 text-xs">day streak</span>
        </div>
      )}
    </header>
  );
}
