'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Calendar, Zap, Clock, TrendingUp, Heart, Dumbbell, Sparkles, LogOut, Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/supabase/AuthContext';

const NAV_ITEMS = [
  { href: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard'     },
  { href: '/planner',    icon: Calendar,         label: 'Planner'       },
  { href: '/log',        icon: Zap,              label: 'Log Workout'   },
  { href: '/movements',  icon: Layers,           label: 'Movements'     },
  { href: '/history',    icon: Clock,            label: 'History'       },
  { href: '/progress',   icon: TrendingUp,       label: 'Progress'      },
  { href: '/longevity',  icon: Heart,            label: 'Longevity Hub' },
  { href: '/coach',      icon: Sparkles,         label: 'AI Coach'      },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-white border-r border-gray-200 flex flex-col z-40">
      {/* Logo */}
      <div className="h-16 px-5 flex items-center border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-vitality-500 flex items-center justify-center">
            <Dumbbell className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm leading-none tracking-wide">VITALITY</div>
            <div className="text-vitality-600 text-xs font-mono font-semibold leading-none mt-0.5">150</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          const isCoach = href === '/coach';
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-vitality-50 text-vitality-700'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-vitality-600' : 'text-gray-400')} />
              {label}
              {isCoach && !active && (
                <span className="ml-auto text-[10px] bg-vitality-100 text-vitality-700 px-1.5 py-0.5 rounded font-medium">AI</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 mb-2 px-3">Train for 150 years of life</p>
        <button
          onClick={() => signOut().then(() => router.push('/login'))}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-red-500 transition-colors w-full px-3 py-1.5 rounded-lg hover:bg-red-50"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
