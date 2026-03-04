import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatTileProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
  className?: string;
}

export function StatTile({ label, value, unit, icon: Icon, color = '#00d4aa', className }: StatTileProps) {
  return (
    <div className={cn('bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-slate-500" />}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-2xl font-bold" style={{ color }}>{value}</span>
        {unit && <span className="text-slate-400 text-sm">{unit}</span>}
      </div>
    </div>
  );
}
