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

export function StatTile({ label, value, unit, icon: Icon, color = '#22C55E', className }: StatTileProps) {
  return (
    <div className={cn('bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-2 shadow-card', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-gray-300" />}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-2xl font-bold" style={{ color }}>{value}</span>
        {unit && <span className="text-gray-400 text-sm">{unit}</span>}
      </div>
    </div>
  );
}
