'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Calendar, Zap, Clock, TrendingUp, Heart, Dumbbell
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard'     },
  { href: '/planner',    icon: Calendar,         label: 'Planner'       },
  { href: '/log',        icon: Zap,              label: 'Log Workout'   },
  { href: '/history',    icon: Clock,            label: 'History'       },
  { href: '/progress',   icon: TrendingUp,       label: 'Progress'      },
  { href: '/longevity',  icon: Heart,            label: 'Longevity Hub' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-vitality flex items-center justify-center shadow-vitality">
            <Dumbbell className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="font-bold text-slate-100 text-sm leading-none">VITALITY</div>
            <div className="text-vitality-500 text-xs font-mono font-medium leading-none mt-1">150</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-vitality-500/10 text-vitality-500 border border-vitality-500/20 shadow-vitality'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-vitality-500' : '')} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <p className="text-xs text-slate-600 text-center">
          Train for 150 years of life
        </p>
      </div>
    </aside>
  );
}
