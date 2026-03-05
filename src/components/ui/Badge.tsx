import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BadgeColor = 'default' | 'vitality' | 'amber' | 'rose' | 'blue' | 'purple' | 'green' | 'cyan';

const colorClasses: Record<BadgeColor, string> = {
  default:  'bg-slate-700 text-slate-300',
  vitality: 'bg-vitality-500/15 text-vitality-500 border border-vitality-500/30',
  amber:    'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  rose:     'bg-rose-500/15 text-rose-400 border border-rose-500/30',
  blue:     'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  purple:   'bg-purple-500/15 text-purple-400 border border-purple-500/30',
  green:    'bg-green-500/15 text-green-400 border border-green-500/30',
  cyan:     'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
};

interface BadgeProps {
  children: ReactNode;
  color?: BadgeColor;
  className?: string;
  dot?: string; // hex color for dot indicator
}

export function Badge({ children, color = 'default', className, dot }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium', colorClasses[color], className)}>
      {dot && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: dot }} />}
      {children}
    </span>
  );
}
