'use client';

import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname.startsWith('/auth/');

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <div className="ml-64 min-h-screen flex flex-col">
        <TopBar />
        <main className="flex-1 p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </>
  );
}
