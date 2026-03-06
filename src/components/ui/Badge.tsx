import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BadgeColor = 'default' | 'vitality' | 'amber' | 'rose' | 'blue' | 'purple' | 'green' | 'cyan';

const colorClasses: Record<BadgeColor, string> = {
  default:  'bg-gray-100 text-gray-600',
  vitality: 'bg-vitality-50 text-vitality-700 border border-vitality-200',
  amber:    'bg-amber-50 text-amber-700 border border-amber-200',
  rose:     'bg-rose-50 text-rose-600 border border-rose-200',
  blue:     'bg-blue-50 text-blue-700 border border-blue-200',
  purple:   'bg-purple-50 text-purple-700 border border-purple-200',
  green:    'bg-green-50 text-green-700 border border-green-200',
  cyan:     'bg-cyan-50 text-cyan-700 border border-cyan-200',
};

interface BadgeProps {
  children: ReactNode;
  color?: BadgeColor;
  className?: string;
  dot?: string;
}

export function Badge({ children, color = 'default', className, dot }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium', colorClasses[color], className)}>
      {dot && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: dot }} />}
      {children}
    </span>
  );
}
